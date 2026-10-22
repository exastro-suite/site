---
layout: news
language: en
sub_dir: /latest/news
page_name: php2shell
page_class: news
title: "PHP Vulnerability \"php2shell\" (CVE-2026-109618 / CVE-2026-109619) and Its Impact on Exastro"
description: "Information on the impact on Exastro and our response policy regarding the two PHP vulnerabilities (known as php2shell) disclosed on October 21, 2026. Exastro IT Automation Ver.2 is not affected."
---

This notice describes the impact on Exastro and our response policy regarding the two vulnerabilities in PHP itself (known as **php2shell**) that were disclosed on October 21, 2026.

**Exastro IT Automation Ver.2 is built on an architecture that does not depend on PHP, so it is not affected by these vulnerabilities.** Only Ver.1 (environments running PHP) is affected.

## 1. Overview of the vulnerabilities

- **CVE-2026-109618** — RCE caused by memory corruption when handling requests under Out-of-Memory conditions
- **CVE-2026-109619** — RCE caused by a reference to freed memory that remains after a request is processed (use-after-free)
- CVSS v4.0: **9.2 (Critical)**
- Remote code execution without authentication
- Affects **all versions of PHP 5.4 and later**
- Affected SAPIs: Apache mod_php / PHP-FPM / php-cgi / FrankenPHP / LiteSpeed
- Disclosed on October 21, 2026 (around 22:40 JST)
- Discovered and reported by researchers from Wiz / Calif / OpenAI / Quarkslab
- Leaked information and a PoC were circulating before the disclosure, and multiple vendors have observed exploitation attempts since immediately after the disclosure

For technical details, please refer to the official PHP advisories (GHSA-w8hw-w9fx-j79w / GHSA-6wmf-4rv5-p3rp), the IPA security alert, JPCERT/CC, and other sources.

## 2. Patch availability from the PHP project

The PHP project has released official fixes in the following versions.

| Branch | Fixed version |
|---|---|
| PHP 8.5 | 8.5.12 |
| PHP 8.4 | 8.4.27 |
| PHP 8.3 | 8.3.36 |
| PHP 8.2 | 8.2.35 |

PHP 7.4 / 8.0 / 8.1 are no longer officially supported (EOL), so no new versions will be released for them.
However, the PHP security team has published minimal backport sources (fix diffs) for PHP 7.4 / 8.0 / 8.1 (for building on your own).

## 3. Configuration patterns of Exastro IT Automation Ver.1

Based on an analysis of the official installer (`ita_installer.sh` / `ita_builder_core.sh`), ITA Ver.1 can be configured in the following patterns.

### 3.1 Supported OS (values of linux_os accepted by the installer)

The `linux_os` key in the answer file (`ita_answers.txt`) accepts **only the following four values**.

- **CentOS7**
- **CentOS8**
- **RHEL7**
- **RHEL8**

(CentOS Stream is not among the options in the installer on the current master branch. This differs from the description in version 1.10 of the official "System Configuration/Environment Construction Guide - Basic".)

### 3.2 PHP version (installed by the installer)

- The installer on the current master branch **installs PHP 7.4** for new installations.
  - RHEL8 / CentOS8: `dnf module reset php && dnf module install php:7.4`
  - RHEL7 / CentOS7: Enables `remi-php74` from the Remi repository and installs it
- The official guide states "PHP 7.2 or 7.4 for v1.10.0 and later" because **this includes environments upgraded from v1.9.1 or earlier that continue to run PHP 7.2**. New installations always use PHP 7.4.

### 3.3 Web server, DB and PHP modules

Main PHP-related packages installed by the installer:

- Apache HTTP Server (httpd 2.4 + mod_ssl)
- MariaDB 10.3 or later
- PHP itself + the following modules
  `php-bcmath / php-cli / php-ldap / php-mbstring / php-mysqlnd / php-pear / php-pecl-zip / php-process / php-snmp / php-xml / php-json / php-gd / php-devel`
- PEAR: HTML_AJAX-0.5.8
- PHP extensions: php-yaml (via pecl), PhpSpreadsheet 1.18.0 (via composer)

The standard configuration runs PHP as mod_php on Apache.

### 3.4 Drivers and optional functions

The optional functions that can be enabled individually with `yes/no` in the answer file are listed below. All of them run on the same ITA server and **share the same PHP environment**.

| Answer key | Function |
|---|---|
| `ita_base` | Basic functions (required) |
| `ansible_driver` | Ansible integration |
| `cobbler_driver` | Cobbler integration |
| `terraform_driver` | Terraform Cloud/Enterprise integration |
| `terraformcli_driver` | Terraform CLI integration |
| `createparam` | Menu creation function |
| `hostgroup` | Host group function |
| `cicd_for_iac` | CI/CD for IaC |

## 4. Impact and response (by configuration pattern)

### 4.1 How to obtain PHP patches by OS

Because these vulnerabilities depend on the PHP version, whether you can actually respond is determined not by how ITA was installed but by **whether the patch is delivered through the host OS package channel**.

| OS | PHP source | How to obtain the patch |
|---|---|---|
| **RHEL8** (PHP 7.4) | RHEL 8 AppStream `php:7.4` module | **Fixed packages are provided in the official Red Hat advisory RHSA-2026:87072.** Can be applied with `dnf upgrade 'php*'` |
| **CentOS8** (PHP 7.4) | CentOS 8 AppStream `php:7.4` module | **CentOS 8 itself reached EOL on 2021/12/31.** No official update channel. Consider migrating to AlmaLinux / Rocky Linux or using a community backport |
| **RHEL7** (PHP 7.4, Remi) | **Remi repository** (remi-php74) | **No official channel for binary patches** (see 4.1.1 for details) |
| **CentOS7** (PHP 7.4, Remi) | Remi repository (remi-php74) | Same as above. CentOS 7 itself also reached the end of standard maintenance on 2024/6/30, so migrating the whole OS is recommended |
| **Environments upgraded from ITA v1.9.1 or earlier** (PHP 7.2 remaining) | Remi or other original source | **PHP 7.2 is not covered by the official backports for this issue.** No safe patching path. Manual switch to PHP 7.4 is required |

#### 4.1.1 Details on PHP 7.4 on RHEL7 / CentOS7 (installed from Remi)

For this issue, ITA environments on RHEL7 / CentOS7 are in a particularly difficult situation compared with other configurations.
Based on the primary information from each source, the situation is as follows.

| Option | Current status |
|---|---|
| **Red Hat RHSA** | **PHP 7.4 on RHEL 7 is not covered by RHSA.** The PHP provided in the standard RHEL 7 repositories is the 5.4 series, which is not affected by these vulnerabilities ([see RHSB-2026-013](https://access.redhat.com/security/vulnerabilities/RHSB-2026-013) — Affected Products lists only RHEL 8/9/10). PHP 7.4 is provided through Software Collections or Remi, and even with an ELS (Extended Life Cycle Support) subscription, PHP 7.4 is not covered by RHSA |
| **Remi (remi-php74) binary updates** | **The EL7 repository was closed on 2026-08-12.** The final EL7 binary is `7.4.33-15`, which does not include the patch for these vulnerabilities. The official PHP advisory of 10/21 also explicitly states that "there are no same-day updates on rpms.remirepo.net" |
| **Remi SRPM (source)** | The SRPM has been updated up to `php-7.4.33-31` and includes the official backport for these vulnerabilities (Patch 243). **Rebuilding it yourself is possible** |
| **Community backport RPMs** | For example, `exception0x876/php74-el7-patched` exists. It is a rebuild from the Remi SRPM. It requires verification and is used at your own risk, and the author explicitly describes it as "a stopgap, not a fix you can live on" |
| **Commercial LTS services** | TuxCare / Zend PHP LTS and others provide paid support for PHP 7.4 in 2026 and beyond |
| **Fundamental solution** | Migrate to PHP 8.2 or later (preferably 8.3 or later), or renew the environment by upgrading the OS/ITA |

As shown above, **there is currently no way to obtain the patch through official repositories.** In the medium to long term, please consider migrating the OS or migrating to ITA Ver.2.

### 4.2 Recommended response by configuration

#### ◆ ITA v1.9.1 or earlier (running PHP 7.2)

PHP 7.2 is EOL and is not covered by the official backports for this issue.
One of the following responses is required.

1. Migrate to ITA Ver.2 (it does not depend on PHP, so it is free from PHP vulnerabilities including this one)
2. Upgrade to ITA v1.10 or later, then manually switch to PHP 7.4 and apply the distribution's patch
3. As an interim measure until the above, defense in depth through network isolation / WAF / access restrictions, etc.

#### ◆ ITA v1.10 or later × RHEL8

This is the easiest configuration to respond to.

```bash
sudo dnf clean metadata
sudo dnf upgrade 'php*'
sudo systemctl restart httpd
```

Red Hat officially provides backported packages for the `php:7.4` module, so you can respond with the usual security update procedure.

#### ◆ ITA v1.10 or later × CentOS8

**CentOS 8 itself is EOL, so there is no official update channel.** Please consider one of the following.

1. Switch to AlmaLinux 8 / Rocky Linux 8 (they are binary compatible, so ITA basically works as is)
2. Migrate to ITA Ver.2
3. Defense in depth as an interim measure

#### ◆ ITA v1.10 or later × RHEL7 / CentOS7

**This is the most difficult configuration to respond to.** See section 4.1.1 for details. The key points are as follows.

- The Remi EL7 repository was closed on 2026-08-12, and no binary updates will be provided (the final EL7 version is `7.4.33-15`, without the patch)
- Red Hat RHSA does not cover PHP 7.4 on RHEL 7 (even under an ELS subscription)
- The Remi SRPM (`php-7.4.33-31`) includes the backported patch, so **rebuilding it yourself** is technically possible
- Community backport RPMs (e.g. `exception0x876/php74-el7-patched`) exist. They must be verified before use, and the author also describes them as a stopgap
- Adopting a commercial LTS service (TuxCare, Zend PHP LTS, etc.) is also an option

**In the medium to long term, we strongly recommend migrating to one of the following.**

1. **Migrate to ITA Ver.2** (it does not depend on PHP, so it is free from this issue)
2. **Migrate the OS to RHEL 8 or later** (the AppStream `php:7.4` module on RHEL 8 is covered by official Red Hat RHSA)
3. **Switch to AlmaLinux / Rocky Linux** (RHEL compatible, with official patches available)

As an interim measure, please apply defense in depth such as network isolation / WAF / access restrictions (see section 4.3).

#### ◆ ITA Ver.2

Ver.2 does not use PHP, so it is not affected by these vulnerabilities. No action is required for this issue.

### 4.3 Interim mitigations (common to all v1 environments)

The following measures do not fix the vulnerabilities themselves, but using them together reduces the risk of attacks reaching the system.

- Change the configuration so that Exastro is not directly accessible from external networks
- Block malicious requests with a WAF / reverse proxy (Cloudflare and others already provide default WAF rules)
- Close unnecessary endpoints and ports, and restrict source IP addresses
- Strengthen monitoring of audit logs / access logs

## 5. Example commands to check the running version and patch status (for v1)

You can check the running PHP version and whether the fix has been applied with the following commands.

```bash
# Check the PHP version
php -v

# RHEL8 / CentOS8: enabled PHP module stream
dnf module list --enabled php

# Check whether the fix is included (whether the changelog contains the CVE numbers)
rpm -q --changelog php | grep -E 'CVE-2026-10961[89]'

# RHEL7 / CentOS7 (Remi): source repository of the installed packages
yum list installed 'php*' | grep remi
```

## 6. Additional information

Additional information on this issue will be updated as needed on this community site and in GitHub Issues.
Please send questions about operational checks or the scope of impact via Issues / Discussions.
