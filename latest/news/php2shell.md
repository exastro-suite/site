---
layout: news
language: ja
page_class: news
title: "PHP の脆弱性「php2shell」(CVE-2026-109618 / CVE-2026-109619) と Exastro への影響について"
description: "2026年10月21日に公開された PHP 本体の脆弱性2件（通称 php2shell）について、Exastro への影響と対応方針をお知らせします。Exastro IT Automation Ver.2 系は影響を受けません。"
---

2026年10月21日に公開された PHP 本体の脆弱性2件(通称 **php2shell**)について、Exastro への影響と対応方針をお知らせします。

なお、**Exastro IT Automation Ver.2 系は PHP に依存しないアーキテクチャで構築されているため、本脆弱性の影響は受けません**。本件の対象となるのは Ver.1 系(PHP 稼働環境)のみとなります。

## 1. 脆弱性の概要

- **CVE-2026-109618** — Out-of-Memory 時のリクエスト処理に起因するメモリ破壊による RCE
- **CVE-2026-109619** — リクエスト処理後に残存する解放済みメモリ参照(use-after-free)による RCE
- CVSS v4.0: **9.2(Critical)**
- 認証不要のリモートコード実行です
- 影響対象は **PHP 5.4 以降のすべてのバージョン** となります
- 影響する SAPI は Apache mod_php / PHP-FPM / php-cgi / FrankenPHP / LiteSpeed です
- 公開日は 2026年10月21日(日本時間 22:40 頃)です
- 発見・報告は Wiz / Calif / OpenAI / Quarkslab の各研究者によるものです
- 公開前にリーク情報と PoC が流通しており、公開直後からの悪用試行が複数ベンダーで観測されています

技術的詳細は PHP 公式アドバイザリ(GHSA-w8hw-w9fx-j79w / GHSA-6wmf-4rv5-p3rp)、IPA 注意喚起、JPCERT/CC 等をご参照ください。

## 2. PHP 本家のパッチ提供状況

PHP プロジェクトから、以下のバージョンで正式な修正版が公開されています。

| ブランチ | 修正版 |
|---|---|
| PHP 8.5 | 8.5.12 |
| PHP 8.4 | 8.4.27 |
| PHP 8.3 | 8.3.36 |
| PHP 8.2 | 8.2.35 |

PHP 7.4 / 8.0 / 8.1 は本家の正式サポート外(EOL)のため、新バージョンのリリースはありません。
ただし、PHP セキュリティチームから PHP 7.4 / 8.0 / 8.1 向けの最小バックポートソース(修正差分)が公開されています(自前ビルド向けです)。

## 3. Exastro IT Automation Ver.1 系の構成パターン

公式インストーラ(`ita_installer.sh` / `ita_builder_core.sh`)の解析結果に基づく、ITA Ver.1 系の取り得る構成パターンは以下の通りです。

### 3.1 サポート OS(インストーラが受け付ける linux_os)

アンサーファイル(`ita_answers.txt`)の `linux_os` キーで指定可能な値は、**以下の4種のみ**です。

- **CentOS7**
- **CentOS8**
- **RHEL7**
- **RHEL8**

(CentOS Stream は現行マスターのインストーラでは選択肢に含まれていません。公式ガイド「システム構成/環境構築ガイド 基本編」第1.10版の記載とは差異があります)

### 3.2 PHP バージョン(インストーラが導入するもの)

- 現行マスターのインストーラは、新規インストール時に **PHP 7.4 を導入** します。
  - RHEL8 / CentOS8: `dnf module reset php && dnf module install php:7.4`
  - RHEL7 / CentOS7: Remi リポジトリから `remi-php74` を有効化してインストール
- 公式ガイド上「v1.10.0 以降は PHP 7.2 または 7.4」とされているのは、**v1.9.1 以前からバージョンアップした環境で PHP 7.2 のまま運用されるケースを含む** ためです。新規インストール経路では PHP 7.4 固定となります。

### 3.3 Web サーバ・DB・PHP モジュール

インストーラが導入する主な PHP 関連パッケージ:

- Apache HTTP Server(httpd 2.4系 + mod_ssl)
- MariaDB 10.3 以上
- PHP 本体 + 以下のモジュール
  `php-bcmath / php-cli / php-ldap / php-mbstring / php-mysqlnd / php-pear / php-pecl-zip / php-process / php-snmp / php-xml / php-json / php-gd / php-devel`
- PEAR: HTML_AJAX-0.5.8
- PHP 拡張: php-yaml(pecl 経由)、PhpSpreadsheet 1.18.0(composer 経由)

PHP は Apache 上で mod_php として動作する構成が標準となります。

### 3.4 ドライバ・オプション機能

アンサーファイルで個別に `yes/no` 指定可能なオプション機能は以下の通りです。すべて同一 ITA サーバ上で稼働し、**同一 PHP 環境を共有** します。

| アンサーキー | 機能 |
|---|---|
| `ita_base` | 基本機能(必須) |
| `ansible_driver` | Ansible 連携 |
| `cobbler_driver` | Cobbler 連携 |
| `terraform_driver` | Terraform Cloud/Enterprise 連携 |
| `terraformcli_driver` | Terraform CLI 連携 |
| `createparam` | メニュー作成機能 |
| `hostgroup` | ホストグループ機能 |
| `cicd_for_iac` | CI/CD for IaC |

## 4. 本脆弱性の影響と対応(構成パターン別)

### 4.1 OS 別の PHP パッチ入手経路

本脆弱性は PHP のバージョンに依存するため、ITA のインストール経路ではなく **ホスト OS のパッケージ経路でパッチが届くかどうか** が実際の対応可否を決めます。

| OS | PHP 配布元 | 本脆弱性パッチの入手経路 |
|---|---|---|
| **RHEL8**(PHP 7.4) | RHEL 8 AppStream `php:7.4` モジュール | **Red Hat 公式 RHSA-2026:87072 で修正済パッケージが提供されています**。`dnf upgrade 'php*'` で適用可能 |
| **CentOS8**(PHP 7.4) | CentOS 8 AppStream `php:7.4` モジュール | **CentOS 8 自体が 2021/12/31 で EOL**。公式更新経路なし。AlmaLinux / Rocky Linux への移行、または有志バックポートの利用を要検討 |
| **RHEL7**(PHP 7.4, Remi) | **Remi リポジトリ**(remi-php74) | **公式のバイナリパッチ入手経路なし**(詳細は 4.1.1 参照) |
| **CentOS7**(PHP 7.4, Remi) | Remi リポジトリ(remi-php74) | 同上。CentOS 7 本体も 2024/6/30 で標準メンテナンス終了のため、OS ごと移行を推奨 |
| **ITA v1.9.1 以前からのアップグレード環境**(PHP 7.2 残存) | 導入元の Remi 等 | **PHP 7.2 系は本件の公式バックポート対象外**。安全なパッチ適用パスなし。PHP 7.4 への手動切替が必要 |

#### 4.1.1 RHEL7 / CentOS7 の PHP 7.4(Remi 導入分)について詳細

本件で RHEL7 / CentOS7 上の ITA 環境は、他の構成と比べて特に対応が難しい状況にあります。
各情報源の一次情報から整理すると以下の通りです。

| 選択肢 | 実態 |
|---|---|
| **Red Hat の RHSA** | **RHEL 7 の PHP 7.4 は RHSA の対象外**。RHEL 7 標準リポジトリで提供される PHP は 5.4 系であり、本脆弱性の影響対象外です([RHSB-2026-013 参照](https://access.redhat.com/security/vulnerabilities/RHSB-2026-013) — Affected Products は RHEL 8/9/10 のみ記載)。PHP 7.4 は Software Collections または Remi 経由での提供となり、ELS(Extended Life Cycle Support)契約があっても PHP 7.4 は RHSA の対象になりません |
| **Remi(remi-php74)バイナリ更新** | **EL7 リポジトリは 2026-08-12 に閉鎖済み**。EL7 最終バイナリは `7.4.33-15` で、本脆弱性のパッチは入っていません。10/21 の PHP 公式アドバイザリでも「rpms.remirepo.net では当日の更新はない」と明示 |
| **Remi の SRPM(ソース)** | SRPM は `php-7.4.33-31` まで更新されており、本脆弱性の公式バックポート(Patch 243)が含まれています。**自前でのリビルドは可能** |
| **有志バックポート RPM** | 例: `exception0x876/php74-el7-patched` 等が存在。Remi SRPM からのリビルド。要検証・自己責任での利用となり、「a stopgap, not a fix you can live on」(延命措置であり恒久対策ではない)と作者自身が明示 |
| **商用 LTS サービス** | TuxCare / Zend PHP LTS 等が PHP 7.4 を 2026 年以降も有償サポート対象として提供 |
| **根本対策** | PHP 8.2 以降(できれば 8.3 以上)への移行、または OS/ITA のバージョンアップによる環境刷新 |

このように、**公式リポジトリ経由でのパッチ入手経路が存在しない** のが現状です。中長期的には OS 移行または ITA Ver.2 系への移行をご検討ください。

### 4.2 構成別の推奨対応

#### ◆ ITA v1.9.1 以前(PHP 7.2 稼働)の場合

PHP 7.2 系は EOL であり、本件の公式バックポート対象外です。
以下のいずれかの対応が必要となります。

1. ITA Ver.2 系への移行(PHP 非依存のため、本件を含む PHP 脆弱性の影響から解放されます)
2. ITA v1.10 以降へのアップグレード、その後 PHP 7.4 系への手動切り替え、ディストリビューションのパッチ適用
3. 上記までの間の暫定措置として、ネットワーク分離 / WAF / アクセス制限等による多層防御

#### ◆ ITA v1.10 以降 × RHEL8 の場合

もっとも対応が容易な構成です。

```bash
sudo dnf clean metadata
sudo dnf upgrade 'php*'
sudo systemctl restart httpd
```

Red Hat が公式に `php:7.4` モジュールのバックポートパッケージを提供しているため、通常のセキュリティアップデート手順で対応可能です。

#### ◆ ITA v1.10 以降 × CentOS8 の場合

**CentOS 8 自体が EOL のため、公式更新経路がありません。** 以下のいずれかを検討してください。

1. AlmaLinux 8 / Rocky Linux 8 への切り替え(バイナリ互換のため ITA 側は原則そのまま動作)
2. ITA Ver.2 系への移行
3. 暫定措置として多層防御

#### ◆ ITA v1.10 以降 × RHEL7 / CentOS7 の場合

**最も対応が難しい構成です。** 詳細は 4.1.1 節をご参照ください。要点は以下の通りです。

- Remi EL7 リポジトリは 2026-08-12 に閉鎖済みで、バイナリ更新は提供されません(EL7 最終版は `7.4.33-15` でパッチ未適用)
- Red Hat の RHSA は RHEL 7 の PHP 7.4 を対象としません(ELS 契約下でも同様)
- Remi の SRPM(`php-7.4.33-31`)にはバックポート済みパッチが含まれているため、**自前リビルド** は技術的に可能
- 有志のバックポート RPM(例: `exception0x876/php74-el7-patched`)が存在。利用時は検証必須で、作者自身も延命措置と位置付けています
- 商用 LTS サービス(TuxCare、Zend PHP LTS 等)の採用も選択肢

**中長期的には以下のいずれかへの移行を強く推奨します。**

1. **ITA Ver.2 系への移行**(PHP 非依存のため本件の影響から解放)
2. **RHEL 8 以降への OS 移行**(RHEL 8 の AppStream `php:7.4` モジュールは Red Hat 公式 RHSA の対象)
3. **AlmaLinux / Rocky Linux への切り替え**(RHEL 系互換で公式パッチ入手が可能)

当面の暫定措置としては、ネットワーク分離 / WAF / アクセス制限等の多層防御(4.3 節参照)を適用してください。

#### ◆ ITA Ver.2 系の場合

Ver.2 系は PHP を使用していないため、本脆弱性の影響は受けません。本件に関する対応は不要です。

### 4.3 暫定的な緩和策(v1 系全環境共通)

本脆弱性そのものを修正するものではありませんが、以下を併用することで到達リスクを低減できます。

- Exastro を外部ネットワークから直接アクセス可能にしない構成への変更
- WAF / リバースプロキシでの不正リクエスト遮断(Cloudflare 等はデフォルト WAF ルールを提供済みです)
- 不要なエンドポイント・ポートの閉塞、アクセス元 IP の制限
- 監査ログ / アクセスログの監視強化

## 5. 稼働バージョンと修正適用状況の確認コマンド例(v1 系向け)

稼働中の PHP バージョンと修正適用状況は、以下のコマンドで確認できます。

```bash
# PHP バージョン確認
php -v

# RHEL8 / CentOS8: 有効な PHP モジュールストリーム
dnf module list --enabled php

# 修正の取り込み確認(changelog に CVE 番号が含まれるか)
rpm -q --changelog php | grep -E 'CVE-2026-10961[89]'

# RHEL7 / CentOS7(Remi): インストール元リポジトリ
yum list installed 'php*' | grep remi
```

## 6. 追加情報

本件に関する追加情報は、本コミュニティサイトおよび GitHub Issues にて随時更新します。
運用上の確認事項・影響範囲に関するご質問は Issues / Discussions にてお寄せください。
