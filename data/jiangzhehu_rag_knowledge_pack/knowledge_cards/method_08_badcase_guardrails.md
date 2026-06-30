---
id: "knowledge_08"
doc_type: "knowledge_card"
title: "AI乡村文旅推荐Badcase与兜底"
tags:
  - "Badcase"
  - "AI产品"
  - "风控"
  - "兜底"
source: "AI产品设计归纳"
use_for:
  - "retrieval_context"
  - "product_reasoning"
  - "prompt_context"
---
# AI乡村文旅推荐Badcase与兜底

## Badcase 1：推荐太泛
表现：任何需求都推荐“古村、咖啡、拍照”。
兜底：每个推荐必须绑定村庄气质、适合人群和具体业态。

## Badcase 2：信息过期
表现：推荐已停业店铺、错误活动时间。
兜底：营业时间、价格、活动档期必须标注“需二次确认”。

## Badcase 3：路线绕路
表现：地图顺序不合理。
兜底：输出轻松版/标准版/紧凑版，并提示距离异常。

## Badcase 4：过度网红化
表现：只推荐拍照点，忽略本地生活。
兜底：加入“本地生活优先”“低商业化”“亲子友好”“社区共创”等偏好开关。

## Badcase 5：忽略风险
表现：推荐水上运动但不提示天气和安全。
兜底：每条涉及户外、水上、宠物、亲子的路线必须带风险卡。

## Badcase 6：机制和游玩混淆
表现：把政府端调研案例当普通游客攻略。
兜底：为每张卡设置use_for字段：tourism / research / mechanism / content_generation。
