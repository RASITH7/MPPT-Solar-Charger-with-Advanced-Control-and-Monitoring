/**
  ******************************************************************************
  * @file    network_data_params.c
  * @author  AST Embedded Analytics Research Platform
  * @date    2026-06-12T01:19:53+0530
  * @brief   AI Tool Automatic Code Generator for Embedded NN computing
  ******************************************************************************
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  ******************************************************************************
  */

#include "network_data_params.h"


/**  Activations Section  ****************************************************/
ai_handle g_network_activations_table[1 + 2] = {
  AI_HANDLE_PTR(AI_MAGIC_MARKER),
  AI_HANDLE_PTR(NULL),
  AI_HANDLE_PTR(AI_MAGIC_MARKER),
};




/**  Weights Section  ********************************************************/
AI_ALIGNED(32)
const ai_u64 s_network_weights_array_u64[353] = {
  0x3e9acc763eecd010U, 0x0U, 0x3de7ceb43e3d53aeU, 0x8000000000000000U,
  0xbc7d30c0bdda91a4U, 0x8000000080000000U, 0xbe83661abe3fb8e3U, 0x0U,
  0xbe22be6fc0515c45U, 0x0U, 0xbea4b08ebe7395f0U, 0x80000000U,
  0x3d8f5543bd4448f0U, 0x8000000000000000U, 0xbe2e8deec0357a03U, 0x8000000000000000U,
  0xbe906ba8be6b2c0cU, 0x8000000080000000U, 0x3d0642d2be6a0c58U, 0x8000000000000000U,
  0xbe5d40013ecfb825U, 0x80000000U, 0xbe7f935abd11c280U, 0x8000000080000000U,
  0xbe89d832be34c42cU, 0x80000000U, 0xbec2cda3be151896U, 0x0U,
  0x3ee504783e147e97U, 0x8000000000000000U, 0xbeff28eabead50f0U, 0x80000000U,
  0xbe651c1fbebba91eU, 0x0U, 0x3ea90da53e4e9274U, 0x8000000080000000U,
  0x3e8e2dbb3ce18741U, 0x80000000U, 0xbd24a890be5bc380U, 0x80000000U,
  0xbf23afefbea9b5a6U, 0x0U, 0xbe8774b6bea43578U, 0x80000000U,
  0xbf03d201bdaa8bc2U, 0x0U, 0x3def2b183e466161U, 0x80000000U,
  0x3ed02ad33f1625c2U, 0x80000000U, 0xbe530ca83ed06624U, 0x8000000000000000U,
  0x3ed908e83ec2ca65U, 0x8000000080000000U, 0x3e16f3a6bc27440bU, 0x0U,
  0xbd531cb8bd03cfa8U, 0x8000000080000000U, 0x3eba26a0be4fd8e2U, 0x8000000080000000U,
  0x3b6aa15ebe5bd53dU, 0x8000000080000000U, 0x3dab02253e1fc8e1U, 0x8000000080000000U,
  0x3d8361843ed1c29fU, 0x0U, 0x3f087b2dU, 0x3ebc95383eea4a84U,
  0xbd0eb7ea00000000U, 0x3ed701a6U, 0x0U, 0x3f488d253ebb2e1aU,
  0x3eada4503f0cadcdU, 0x3eccebbbU, 0x3f69bfceU, 0x3ec0938f3f08c9c0U,
  0x3ecffb463eb918d8U, 0x3ed143b43ec7f14fU, 0x3edd875700000000U, 0x3e6e5ce1bc7b891cU,
  0x3c56994d3e9dd9b9U, 0xbeb2d2f43e36b1c2U, 0xbe74bf73bffc1accU, 0xc00a41be3dbbbe9dU,
  0x3dee30833e4080baU, 0x3e191c6a3e803499U, 0x3eaa1dbbbe138a54U, 0x3f84ef163ec79b0cU,
  0x3ec923a53f48e544U, 0xbe87fd493ecbc1fcU, 0x3dd103143f9a3ac3U, 0x3d8d98063e84a1c4U,
  0x3ebd940a3eef62c7U, 0x3f23c6243f03d5c0U, 0x3ea163393e1db1e6U, 0x3e570f73be9dd498U,
  0x3e446646be56de91U, 0xbe0e41bf3e09a6bcU, 0x3d84fc3c3e4785b2U, 0x3e6090aabe259417U,
  0xbd752a00beaf3905U, 0x3e4d7ed2be607c0cU, 0x3e2979febea8fefeU, 0x3e159a0e3e20a772U,
  0xbe9c79913e2059faU, 0x3e4ab2be3d0ab810U, 0xbe2280afbe5be9b3U, 0x3e9082cdbe21cdebU,
  0x3ea9bc5fbeb49d07U, 0x3e121f903e115fd8U, 0xbe9b419f3e0c1e0cU, 0x3e273aae3e6625deU,
  0x3c1934c0be9bb60dU, 0x3e36d6823d7631d8U, 0xbe3b483f3c14a5a0U, 0xbe5002e8beaf3384U,
  0x3e5479523e917b55U, 0xbe18e25c3d7bee10U, 0x3de336a43e6b3ad2U, 0xbe9299e4bbcfb500U,
  0x3d146520be118756U, 0x3e8b21773e5df3ceU, 0xbe9f8852be158cf8U, 0x3dd84e04be529ff6U,
  0x3dcba168be14807eU, 0xbc963670be45e7d9U, 0x3e0341f4bd79ba28U, 0x3eabcad1be5b033fU,
  0xbe28e85ebe3737d4U, 0xbe9fe4d2bd96c0e0U, 0xbe06c9003ea0ed7bU, 0xbe85e2b03d9af15aU,
  0x3d2fd1303e8e4df3U, 0x3e61c84ebd2082fcU, 0x3ea812ed3db31c20U, 0x3e9c402fbe2b51d6U,
  0xbe1d032fbd9a076bU, 0x3eb2b9b33db496cbU, 0x3d6c8208bd05b173U, 0xbdf54072bda49b59U,
  0xbe6afeaebe7fa44fU, 0x3e621fdf3c61e349U, 0xbe59ded43d9912a0U, 0xbe0e45a73e8b5515U,
  0x3d2cec203ed3ab4fU, 0x3e4ae43e3e15b7aaU, 0xbe941b5abfee8c3bU, 0xbfdd12e43eb5a853U,
  0x3e0eef49be3d3da1U, 0x3d49e5b83f106225U, 0x3d687a183cdff680U, 0x3f4a3e113ecde8e7U,
  0x3f12bc0d3f1cffffU, 0xbea8bcfa3e60388cU, 0xbd0c18183f816593U, 0x3eca5e033f2757eaU,
  0x3f2f6dfe3ea82e55U, 0x3f3132b23f0ba85aU, 0x3f25c21bbe7378a2U, 0x3e41d5c5be07a641U,
  0xbd596db0be5c39e3U, 0xbe838ab93d89ba60U, 0xbe1cae363ead0ce5U, 0x3c199820be2f8087U,
  0x3d204d903e9b592bU, 0xbd2f02483e811963U, 0x3e93f0b5bcc79d90U, 0x3dcb0d483ea75029U,
  0xbe0b902fbe9fa62dU, 0x3d570f983dca25b4U, 0xbe99187c3e2752eeU, 0xbdb634343eae21c1U,
  0xbe8fc082bd7988e8U, 0xbe9ba28abd927fecU, 0xbeb0498ebe843af0U, 0xbe4c01733d08ea68U,
  0x3ea051e5be7940b2U, 0x3e8d5797be3aaf23U, 0xbe0b774dbe9463adU, 0x3e1e4f8e3df5f32cU,
  0x3e7b770a3e812f95U, 0x3dbad8a4397b2000U, 0xbe8b9941beb17394U, 0x3e3fad52be834039U,
  0xbe8ce516bea14b78U, 0xbcf1cfb0bcb143d0U, 0xbe1df7c5be5c45c1U, 0x3e88d897be486c16U,
  0x3e8a295bbd253ea8U, 0xbe98f719bdd7f9a6U, 0xbe9828d5bcce4eb0U, 0xbdf89f08be8cb5f6U,
  0x3dde31cebc9ea9e5U, 0xbaed61003e469c1eU, 0x3eb055493da2f850U, 0x3d824caabdda1a79U,
  0x3e23a119bea4d518U, 0xbe823574bea598fcU, 0xbe7c0c66be51ac30U, 0xbc8f02793d9198efU,
  0x3e844cfe3e8ea46eU, 0x3c99b0d03e2f7703U, 0x3e8c7e61bd7d6760U, 0x3e015e9fbde015ddU,
  0xbe6860353df7605fU, 0xbd7ea9debe845b5eU, 0xbeb0f5df3d9337b0U, 0xbd2fc7f43e271153U,
  0x3d5531933b9712eaU, 0xbe155910bd1a46a8U, 0xbcac752040179e9bU, 0x3fef2a30bec7f13aU,
  0x3ea7430abe81b206U, 0xbeb0ec39be3b84c9U, 0x3df381a8be776c0aU, 0x3f00a1d03e2f9adbU,
  0xbeff2bf03f067d75U, 0x3e034ffebc0238f4U, 0xbe1f83e73db32b27U, 0xbe7fe9113e300985U,
  0xbebee5a5beb9a99fU, 0x3e3787a73dfe4260U, 0x3eb4944f3da54a78U, 0xbd32b436bbb6d29dU,
  0xbe8e44eebdc7cf6fU, 0x3e3fd5aabe8f64c6U, 0xbe3bfae7bd787f7cU, 0xbe9db68ebd98b1eeU,
  0x3d0ea7efbd78b978U, 0x3dd88894be106066U, 0xbb368a003e754bcaU, 0x3e3794c1be4ff322U,
  0x3dcc68083e228c68U, 0xbd95f288bd21369aU, 0x3e3ae596bc97d54fU, 0x3e56c0c2be3d02adU,
  0x3e8a560c3e3d68c5U, 0xbecf5815be69a4c1U, 0x3d855166be871bdaU, 0x3e28e9ca3e3e53abU,
  0x3cf90b443e46bf64U, 0x3d52a970be608eebU, 0x3e81447fc015058aU, 0xbfdb02013eaf554eU,
  0xbe869dce3d80ce48U, 0x3e8e00bd3e2d1986U, 0xbe3a04a83cec4a80U, 0x3fb32cac3f0f3c70U,
  0x3de8786c3ebc3923U, 0x3d9bea5c3eeb0b56U, 0x3e3bc7823f9e088bU, 0x3efce98b3ed3d3bfU,
  0x3ecda6483ea0947eU, 0x3f1419133e9e7a9fU, 0x3e2d750abeb21233U, 0xbd39ab1a3e99799bU,
  0xbdb5de78bddeb5ccU, 0x3e960a6fbd0fb1e8U, 0xbe93d8e5bea6a33bU, 0x3e7737eabda65fd4U,
  0xbdba2b443d9f7060U, 0xbc41e460beab6109U, 0x3e2f5a3a3d46d398U, 0xbdd67bf2bd727560U,
  0xbe22f4e43ea5d731U, 0x3e9bdbefbd618e98U, 0xbe0475d63d62d468U, 0xbe8d5d81be6de89cU,
  0xbda34d84bdcd8d28U, 0xbc5f8f80be550106U, 0x3e8e57ebbd10c8f0U, 0xbe814077bdd079acU,
  0xbd337de43e9fc6d4U, 0xbda755603e896759U, 0xbeaf1744c01cc8bbU, 0xc00919b93f0e9cc5U,
  0xbe96b8d43e2bf20aU, 0x3e7141ea3f28f964U, 0x395e2000be5ca54dU, 0x3faa8dc83e6c69afU,
  0x3e3ac3e03f0dcc09U, 0xbcf098303ed8ae73U, 0x3e5ebf423fc06b10U, 0x3ed94cf73f3c3783U,
  0x3f01accd3c8a1068U, 0x3f15acf2bd2eaaffU, 0x3ece66bc3e335fa6U, 0x3ef6107d3e47821aU,
  0xbe8bf4c53e66f3a6U, 0x3e28cbde3e8f5501U, 0xbe47f19a3de56fbcU, 0xbd42cb20be9d9989U,
  0xbe41faa13e934595U, 0x3e85f3133d7bc770U, 0xbdd9b12a3e8551bfU, 0xbe041cebbea889a2U,
  0x3e044ff6be307ee3U, 0x3cd8d6b0be150803U, 0x3df2700c3dbb3d18U, 0xbe19be3abd95a438U,
  0x3dcf919cbdc5360cU, 0xbe7f72c8be6e54d2U, 0xbeb207953c5e9240U, 0xbe166e9b3d10f418U,
  0x3ee24ab83eb04dadU, 0xbd45ab20bc6b8d60U, 0xbde83a2ec017ceccU, 0xc00602e63f36f69cU,
  0x3e8c3bbd3c89e2c0U, 0x3e05a9403f084c10U, 0x3d2a10c03ea76399U, 0x3fad13463cc12a6eU,
  0x3e62e7a13efd8969U, 0x3e3711ba3d5f5e7cU, 0x3e21db3a3f8f072dU, 0x3eaf2a633f197583U,
  0x3e4346c03d433d8aU, 0x3e4b0f673edd94cbU, 0x3dea5eaebbc69140U, 0x3ebcdb893ea19523U,
  0x3db71e84be9dc17aU, 0xbe89d68d3d4d07c0U, 0x3dcf5064be329734U, 0x3db4361a3e32a625U,
  0xbd88b5db3e182236U, 0x3e9fd3a1be8e03f5U, 0x3da500f83e8c1fb5U, 0xbd656023bd4b87f2U,
  0x3e086a9bbdca7707U, 0xbe38ef0dbe19708bU, 0x3e5442d63eaa7589U, 0x3d9db4a9be6e057fU,
  0x3dd7045d3e176904U, 0xbd74f14bbdaedb2dU, 0xbe27fddfbd605408U, 0x3e985b843c3a622aU,
  0x3eb163e5U, 0xbcf2b0fa00000000U, 0x3e89aca9U, 0xbd85274c00000000U,
  0xbd356b68bdb4c505U, 0x3e92f7d5U, 0x3eaee12eU, 0xbd230b063ed44499U,
  0x3cb7ab603f0725fdU, 0x3e4f849c3e293c04U, 0x3db0a6083f65e1e9U, 0xbe0e168abdfc4960U,
  0xbea96f5fbfbe2c93U, 0xbe39f7783f871637U, 0x3e3d4f983f7f1762U, 0xbeda01ea3f1371eaU,
  0x3e743aa8U,
};


ai_handle g_network_weights_table[1 + 2] = {
  AI_HANDLE_PTR(AI_MAGIC_MARKER),
  AI_HANDLE_PTR(s_network_weights_array_u64),
  AI_HANDLE_PTR(AI_MAGIC_MARKER),
};

