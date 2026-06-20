/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body - IC MPPT with Under-Voltage Protection
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include <math.h> // Needed for fabs()

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
ADC_HandleTypeDef hadc1;
DMA_HandleTypeDef hdma_adc1;

TIM_HandleTypeDef htim8;

/* USER CODE BEGIN PV */
// Raw ADC values updated automatically by DMA
// [0]=V_pv, [1]=I_pv, [2]=V_bat, [3]=I_bat, [4]=Irr, [5]=Temp
volatile uint32_t adc_values[6];

// Float array to hold the calculated real-world values for Live Expressions
volatile float actual_values[6];

// --- MPPT Persistent Variables ---
float V_prev = 0.0f;
float I_prev = 0.0f;
float D_prev = 0.15f; // Start at D_min

// Timing variable for MPPT execution rate
uint32_t last_mppt_run_time = 0;

// State variable for Under-Voltage Lockout (UVLO)
uint8_t system_is_active = 0; // 0 = OFF, 1 = ON
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_ADC1_Init(void);
static void MX_TIM8_Init(void);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */


	HAL_Init();

  /* Configure the system clock */
  SystemClock_Config();

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_ADC1_Init();
  MX_TIM8_Init();

  /* USER CODE BEGIN 2 */

  // Keep Gate Driver OFF initially for safety
  HAL_GPIO_WritePin(GPIOD, GPIO_PIN_9, GPIO_PIN_RESET);

  if (HAL_TIM_PWM_Start(&htim8, TIM_CHANNEL_1) != HAL_OK)
  {
      Error_Handler();
  }

  // Start the ADC in DMA mode
  HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_values, 6);

  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
	  //this is normal pv soalr
      // --- CALIBRATION MATH ---
      actual_values[0] = (0.0076146f * (float)adc_values[0]) - 0.0804105f; // V_PV
      actual_values[1] = (0.0014478f * (float)adc_values[1]) - 0.1090731f; // I_PV
      actual_values[2] = (0.0111027f * (float)adc_values[2]) - 0.1062549f; // V_BATT add another resistor
      actual_values[3] = (0.0012095f * (float)adc_values[3]) + 0.1003010f; // I_BATT
      actual_values[4] = (44.2522078f * (float)adc_values[4]) - 144.5912166f; // PV_Irradiance (Lux)
      actual_values[5] = (0.0802774f  * (float)adc_values[5]) - 5.0963303f;  // PV_Temperature (C)

      // Clamp negative values to 0 for cleaner math
      for(int i = 0; i < 4; i++) {
          if (actual_values[i] < 0.0f) actual_values[i] = 0.0f;
      }

      // --- UNDER-VOLTAGE LOCKOUT (WITH HYSTERESIS) ---
      // If the system is currently ON, but voltage drops below 10V -> Turn OFF
      if (system_is_active == 1 && actual_values[0] < 10.0f)
      {
          system_is_active = 0;
      }
      // If the system is currently OFF, wait until voltage rises above 12V to turn back ON
      else if (system_is_active == 0 && actual_values[0] > 12.0f)
      {
          system_is_active = 1;
      }

      // --- EXECUTE BASED ON SYSTEM STATE ---
      if (system_is_active == 0)
      {
          // SYSTEM OFF: Voltage is too low (Night time / heavy shade)
          HAL_GPIO_WritePin(GPIOD, GPIO_PIN_9, GPIO_PIN_RESET); // Disable Gate Driver
          __HAL_TIM_SET_COMPARE(&htim8, TIM_CHANNEL_1, 0);      // Set PWM to 0%

          // Reset MPPT variables so it starts fresh when the sun comes back
          D_prev = 0.15f;
          V_prev = actual_values[0];
          I_prev = actual_values[1];
      }
      else
      {
          // SYSTEM ON: Sun is up and voltage is stable
          HAL_GPIO_WritePin(GPIOD, GPIO_PIN_9, GPIO_PIN_SET);   // Enable Gate Driver

          // --- INCREMENTAL CONDUCTANCE MPPT ALGORITHM ---
          // Run the MPPT logic every 10 milliseconds (100 Hz sampling rate)
          if (HAL_GetTick() - last_mppt_run_time >= 10)
          {
              last_mppt_run_time = HAL_GetTick();

              float V = actual_values[0];
              float I = actual_values[1];
              float duty = D_prev;

              float deltaD = 0.002f;
              float D_max = 0.85f;
              float D_min = 0.15f;
              float tol = 0.4f;

              // Prevent division by zero
              if (V < 0.1f) V = 0.1f;

              float dV = V - V_prev;
              float dI = I - I_prev;

              if (fabs(dV) < 0.01f) // Floating point safety
              {
                  if (fabs(dI) < 0.01f) {
                      duty = D_prev;
                  } else if (dI > 0) {
                      duty = D_prev - deltaD;
                  } else {
                      duty = D_prev + deltaD;
                  }
              }
              else
              {
                  float G = I / V;
                  float dG = dI / dV;

                  if (fabs(dG + G) < tol) {
                      duty = D_prev;
                  } else if (dG > -G) {
                      duty = D_prev - deltaD;
                  } else {
                      duty = D_prev + deltaD;
                  }
              }

              // Apply Duty Cycle Limits
              if (duty > D_max) duty = D_max;
              if (duty < D_min) duty = D_min;

              // Update state variables for next cycle
              V_prev = V;
              I_prev = I;
              D_prev = duty;

              // Apply to Hardware Timer (Multiply 0.0-1.0 by 100 for the Timer ARR)
              uint32_t timer_compare_value = (uint32_t)(duty * 100.0f);
              __HAL_TIM_SET_COMPARE(&htim8, TIM_CHANNEL_1, timer_compare_value);
          }
      }

      // Small delay just to prevent CPU maxing out
      HAL_Delay(1);

    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_NONE;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_HSI;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_0) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief ADC1 Initialization Function
  */
static void MX_ADC1_Init(void)
{
  ADC_ChannelConfTypeDef sConfig = {0};

  hadc1.Instance = ADC1;
  hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV2;
  hadc1.Init.Resolution = ADC_RESOLUTION_12B;
  hadc1.Init.ScanConvMode = ENABLE;
  hadc1.Init.ContinuousConvMode = ENABLE;
  hadc1.Init.DiscontinuousConvMode = DISABLE;
  hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
  hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
  hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
  hadc1.Init.NbrOfConversion = 6;
  hadc1.Init.DMAContinuousRequests = ENABLE;
  hadc1.Init.EOCSelection = ADC_EOC_SINGLE_CONV;
  if (HAL_ADC_Init(&hadc1) != HAL_OK)
  {
    Error_Handler();
  }

  sConfig.Channel = ADC_CHANNEL_7;
  sConfig.Rank = 1;
  sConfig.SamplingTime = ADC_SAMPLETIME_480CYCLES;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK) { Error_Handler(); }

  sConfig.Channel = ADC_CHANNEL_5;
  sConfig.Rank = 2;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK) { Error_Handler(); }

  sConfig.Channel = ADC_CHANNEL_15;
  sConfig.Rank = 3;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK) { Error_Handler(); }

  sConfig.Channel = ADC_CHANNEL_6;
  sConfig.Rank = 4;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK) { Error_Handler(); }

  sConfig.Channel = ADC_CHANNEL_4;
  sConfig.Rank = 5;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK) { Error_Handler(); }

  sConfig.Channel = ADC_CHANNEL_3;
  sConfig.Rank = 6;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK) { Error_Handler(); }
}

/**
  * @brief TIM8 Initialization Function
  */
static void MX_TIM8_Init(void)
{
  TIM_MasterConfigTypeDef sMasterConfig = {0};
  TIM_OC_InitTypeDef sConfigOC = {0};
  TIM_BreakDeadTimeConfigTypeDef sBreakDeadTimeConfig = {0};

  htim8.Instance = TIM8;
  htim8.Init.Prescaler = 15;
  htim8.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim8.Init.Period = 99;
  htim8.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim8.Init.RepetitionCounter = 0;
  htim8.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
  if (HAL_TIM_PWM_Init(&htim8) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim8, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sConfigOC.OCMode = TIM_OCMODE_PWM1;
  sConfigOC.Pulse = 13;
  sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
  sConfigOC.OCNPolarity = TIM_OCNPOLARITY_HIGH;
  sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
  sConfigOC.OCIdleState = TIM_OCIDLESTATE_RESET;
  sConfigOC.OCNIdleState = TIM_OCNIDLESTATE_RESET;
  if (HAL_TIM_PWM_ConfigChannel(&htim8, &sConfigOC, TIM_CHANNEL_1) != HAL_OK)
  {
    Error_Handler();
  }
  sBreakDeadTimeConfig.OffStateRunMode = TIM_OSSR_DISABLE;
  sBreakDeadTimeConfig.OffStateIDLEMode = TIM_OSSI_DISABLE;
  sBreakDeadTimeConfig.LockLevel = TIM_LOCKLEVEL_OFF;
  sBreakDeadTimeConfig.DeadTime = 0;
  sBreakDeadTimeConfig.BreakState = TIM_BREAK_DISABLE;
  sBreakDeadTimeConfig.BreakPolarity = TIM_BREAKPOLARITY_HIGH;
  sBreakDeadTimeConfig.AutomaticOutput = TIM_AUTOMATICOUTPUT_DISABLE;
  if (HAL_TIMEx_ConfigBreakDeadTime(&htim8, &sBreakDeadTimeConfig) != HAL_OK)
  {
    Error_Handler();
  }
  HAL_TIM_MspPostInit(&htim8);
}

/**
  * Enable DMA controller clock
  */
static void MX_DMA_Init(void)
{
  __HAL_RCC_DMA2_CLK_ENABLE();
  HAL_NVIC_SetPriority(DMA2_Stream0_IRQn, 0, 0);
  HAL_NVIC_EnableIRQ(DMA2_Stream0_IRQn);
}

/**
  * @brief GPIO Initialization Function
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};

  __HAL_RCC_GPIOH_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOD_CLK_ENABLE();

  HAL_GPIO_WritePin(GPIOD, GPIO_PIN_9, GPIO_PIN_RESET);

  GPIO_InitStruct.Pin = GPIO_PIN_9;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOD, &GPIO_InitStruct);
}

void Error_Handler(void)
{
  __disable_irq();
  while (1)
  {
  }
}

#ifdef  USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line)
{
}
#endif /* USE_FULL_ASSERT */
