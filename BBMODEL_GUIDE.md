# 🧊 Blockbench (.bbmodel) 連携ガイド

MARV - Resource Pack Maker では、Blockbench で作成した `.bbmodel` ファイルを直接インポートして、Minecraft のカスタムモデルとして利用することができます。

---

## 🚀 クイックスタート

1.  **Blockbench でモデルを作成**:
    *   通常の「Java Block/Item」プロジェクトとして作成します。
    *   テクスチャを適用し、保存（`.bbmodel`）します。
2.  **MARV へインポート**:
    *   「モデル管理 (Models)」タブを開きます。
    *   「既存パックをインポート」ボタンの横にあるアップロードエリア、またはモデル一覧エリアに `.bbmodel` ファイルをドラッグ＆ドロップします。
    *   自動的にモデルとテクスチャが展開されます。

---

## 🎯 自動判別機能 (スマートインポート)

ファイルをインポートする際、ファイル名から **「対象アイテム」** と **「CustomModelData (CMD)」** を自動的に判別します。

### ファイル名のルール
`{アイテム名}_{CMD番号}.bbmodel` という形式にすると、設定の手間が省けます。

*   **例: `diamond_sword_101.bbmodel`**
    *   対象アイテム: `diamond_sword` (ダイヤの剣)
    *   CustomModelData: `101`
*   **例: `stick_5.bbmodel`**
    *   対象アイテム: `stick` (棒)
    *   CustomModelData: `5`
*   **例: `shield.bbmodel`** (番号なし)
    *   対象アイテム: `shield` (盾)
    *   CustomModelData: 空いている最小の番号（自動割り当て）

---

## ✨ インポート時に行われること

1.  **テクスチャの自動抽出**:
    *   `.bbmodel` ファイル内に埋め込まれているテクスチャ画像が自動的に抽出され、「テクスチャ管理」タブに追加されます。
2.  **モデル構成の維持**:
    *   Blockbench で設定した `elements`（立方体データ）や `display`（手に持った時や額縁に入れた時の位置調整）がそのまま維持されます。
3.  **Bedrock 対応 (高度な設定)**:
    *   エディション設定が「Bedrock」の場合、Java Edition のデータを Bedrock 用の `geometry` 形式に自動変換して取り込みます。

---

## 💡 ヒントと注意点

*   **テクスチャ名**: Blockbench 内でテクスチャに名前を付けておくと、インポート後の管理が楽になります。
*   **CMD=0 の活用**: ファイル名に `_0` を付けるか、インポート後に設定を `0` に変更すると、バニラのアイテムモデルそのものを上書きできます。
*   **ファイルサイズ**: 非常に複雑なモデル（要素数が多いもの）は、Minecraft 内での描画パフォーマンスに影響を与える可能性があります。

---

# 🧊 Blockbench (.bbmodel) Integration Guide

MARV - Resource Pack Maker allows you to directly import `.bbmodel` files created in Blockbench to use as custom Minecraft models.

## 🚀 Quick Start

1.  **Create in Blockbench**:
    *   Use a "Java Block/Item" project type.
    *   Apply your textures and save as a `.bbmodel` file.
2.  **Import to MARV**:
    *   Go to the **Models** tab.
    *   Drag and drop your `.bbmodel` file into the upload area or model list.
    *   Models and textures will be extracted automatically.

## 🎯 Auto-Detection (Smart Import)

The app automatically detects the **Target Item** and **CustomModelData (CMD)** based on the filename.

### Filename Convention
Use the format `{item_name}_{cmd_number}.bbmodel`.

*   **Example: `diamond_sword_101.bbmodel`**
    *   Target Item: `diamond_sword`
    *   CustomModelData: `101`
*   **Example: `stick_5.bbmodel`**
    *   Target Item: `stick`
    *   CustomModelData: `5`

## ✨ What happens during import?

1.  **Texture Extraction**: Embedded textures are automatically extracted and added to the **Textures** tab.
2.  **Display Settings**: Your hand-held or frame display adjustments from Blockbench are preserved.
3.  **Bedrock Conversion**: If the edition is set to "Bedrock" in Advanced settings, the model will be converted to Bedrock geometry format automatically.
