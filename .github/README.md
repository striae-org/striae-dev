# 🔫 Striae - A Firearms Examiner's Comparison Companion

[![Bronze Sponsor](https://opencollective.com/striae/tiers/backers/badge.svg?label=Bronze%20Sponsor&color=brightgreen)](https://opencollective.com/striae)
&nbsp;&nbsp;
[![Silver Sponsor](https://opencollective.com/striae/tiers/sponsors/badge.svg?label=Silver%20Sponsor&color=brightgreen)](https://opencollective.com/striae)
&nbsp;&nbsp;
[![Gold Sponsor](https://opencollective.com/striae/tiers/gold-sponsor/badge.svg?label=Gold%20Sponsor&color=brightgreen)](https://opencollective.com/striae)
&nbsp;&nbsp;
[![Financial Contributors](https://opencollective.com/striae/tiers/badge.svg)](https://opencollective.com/striae)

## 🌐 Application URL

**[Live App](https://www.striae.org)**

## 📚 Documentation

**[Striae Documentation](https://developers.striae.org/striae-dev/get-started/document-index)**

## 💬 Contact & Support

**[Striae Support](https://www.striae.org/support)**

**[Striae on Discord](https://discord.gg/ESUPhTPwHx)**

---

## 🚀 Quick Start Install

Ready to deploy Striae? Follow these steps to get your own instance running:

### Prerequisites

- **Cloudflare Account** with a registered domain
- **Firebase Project** with Authentication enabled and MFA configured
- **SendLayer Account** for email services
- **Node.js** v20+ and Git

### Cloudflare Services Setup

Set up these Cloudflare services first:

- **Turnstile** (bot protection) - Note site/secret keys
- **Images** (file storage) - Note account ID, hash, API token, HMAC key
- **KV** (user database) - Create namespace, note UUID
- **R2** (data and audit storage) - Create two buckets, configure CORS (see [installation guide](https://developers.striae.org/striae-dev/get-started/installation-guide#24-cloudflare-r2-setup))

### Deployment Steps

1. **Fork & Clone**: Fork the repository to your account and clone it locally

   ```bash
   git clone https://github.com/YOUR_USERNAME/striae.git
   cd striae
   ```

2. **Install Dependencies**: Install all required packages

   ```bash
   npm install
   ```

3. **Deploy Everything**: Run the unified deployment command

   ```bash
   npm run deploy:all
   ```

   The script will interactively prompt you for all configuration values including Firebase settings, Cloudflare credentials, and custom domains (for Workers).

4. **Test & Verify**: Test authentication, file uploads, and core features

### What Gets Deployed

- ✅ 7 Cloudflare Workers (backend microservices)
- ✅ Cloudflare Pages frontend
- ✅ All environment variables and secrets
- ✅ CORS configuration
- ✅ Worker-to-worker communication

**Total setup time**: ~30-45 minutes

For detailed instructions and troubleshooting, see the **[Complete Installation Guide](https://developers.striae.org/striae-dev/get-started/installation-guide)**

---

## 📋 Changelog

## [2025-10-01] - *[Release v1.0.0](https://github.com/striae-org/striae/releases/tag/v1.0.0)*

- **🎉 Stable Production Release** - First stable release of Striae marking production readiness after comprehensive beta development and testing. See release notes for full details.
- **Critical Bug Fixes** - Resolved filename collision handling during case import and fixed file name display issues in import orchestrator

## [2025-09-28] - *[Release v0.9.28-beta](https://github.com/striae-org/striae/releases/tag/v0.9.28-beta)*

- **Cryptographic Security Enhancement** - Complete migration from CRC32 to SHA-256 for forensic-grade data integrity validation with tamper-proof hash generation
- **Infrastructure Modernization** - Full TypeScript conversion of all 7 Cloudflare Workers providing enhanced type safety and error prevention
- **Performance Optimization** - Batch processing implementation for large case file operations and audit entries preventing timeout issues
- **Enhanced Documentation** - White paper integration and comprehensive SHA-256 security guides for forensic compliance

## [2025-09-24] - *[Release v0.9.24-beta](https://github.com/striae-org/striae/releases/tag/v0.9.24-beta)*

- **Storage Function Centralization** - Unified all data operations into centralized utility modules with built-in permission validation and security controls
- **Audit Trail System Corrections** - Fixed filtering logic, reorganized activity categories, and consolidated action types for accurate audit tracking  
- **Enhanced Permission Validation** - Mandatory access control for all case operations preventing security bypasses with comprehensive type safety
- **Comprehensive Testing & QA** - Extensive pre-release candidate testing ensuring production readiness for October 1, 2025 release candidate

## [2025-09-22] - *[Release v0.9.22a-beta](https://github.com/striae-org/striae/releases/tag/v0.9.22a-beta)*

- **Comprehensive Audit Trail System** - Complete forensic audit logging providing full visibility into all case-related activities, user actions, and system operations with 5-phase workflow categorization
- **Mandatory Case Linkage Enhancement** - All case-related operations now require case number association ensuring complete audit trail integrity for forensic documentation  
- **Enhanced Box Annotation Auditing** - Complete audit logging for box annotation creation, editing, and deletion with position data, color information, and file context
- **File Lifecycle Tracking** - Comprehensive file operation logging including uploads, access, and deletion with integrity validation and performance metrics
- **Authentication Activity Monitoring** - Complete user action tracking including login, logout, MFA operations, and profile management with security event logging

## [2025-09-22] - *[Release v0.9.22-beta](https://github.com/striae-org/striae/releases/tag/v0.9.22-beta)*

- **Authenticated Confirmations System** - Complete implementation of firearms identification workflow with digital examiner verification and cryptographic integrity
- **Independent Review Process** - Structured export/import workflow allowing reviewing examiners to confirm original findings with full audit trail
- **Confirmation Security Framework** - Multi-layer validation including checksum verification, timestamp validation, and self-confirmation prevention
- **Enhanced Documentation** - Comprehensive confirmation guides and FAQ integration covering complete workflow from examination to final documentation

## [2025-09-20] - *[Release v0.9.20-beta](https://github.com/striae-org/striae/releases/tag/v0.9.20-beta)*

- **Export Security Enhancement** - Multi-layer authentication and validation for all case export operations with improved error handling
- **Case Review Import System** - Comprehensive ZIP package import utility allowing complete case review with automatic read-only protection
- **Complete Image Integration** - Seamless import of cases with all associated images, annotations, and metadata preservation
- **Production Code Quality** - Comprehensive console log cleanup while maintaining essential error logging and audit trails

## [2025-09-18] - *[Release v0.9.18-beta](https://github.com/striae-org/striae/releases/tag/v0.9.18-beta)*

- **Automated Deployment System** - Streamlined deployment scripts with unified `deploy:all` command and enhanced cross-platform support
- **CSS Architecture Improvements** - Global button hover effects system and mobile responsiveness cleanup for desktop-first focus
- **Developer Documentation Updates** - Restructured installation guide, enhanced environment setup documentation, and improved developer workflow
- **Infrastructure Enhancements** - Improved build system, dependency management, and deployment script organization

## [2025-09-17] - *[Release v0.9.17a-beta](https://github.com/striae-org/striae/releases/tag/v0.9.17a-beta)*

- **ZIP Export System with Images** - Advanced ZIP package generation with automatic image inclusion for complete case archival
- **Enhanced Export Interface** - Smart "Include Images" checkbox with intelligent UI logic for optimal user experience
- **Excel Format Optimization** - Box annotations now split into separate rows matching CSV structure for improved data analysis
- **Type System Cleanup** - Removed unused type definitions and reorganized type architecture for better maintainability
- **Code Quality Improvements** - Eliminated redundant files, optimized imports, and enhanced TypeScript compliance
- **Comprehensive Documentation Updates** - Updated all developer and user documentation reflecting new ZIP export capabilities

## [2025-09-17] - *[Release v0.9.17-beta](https://github.com/striae-org/striae/releases/tag/v0.9.17-beta)*

- **Comprehensive Case Data Export System** - Complete multi-format export functionality with JSON, CSV, and Excel (XLSX) support
- **Advanced Export Features** - Single case and bulk export capabilities with real-time progress tracking and intelligent error handling
- **Professional XLSX Integration** - Multi-worksheet Excel files with summary data and detailed case information using SheetJS library
- **Enhanced User Interface** - Polished export modal with format selection, progress visualization, and responsive design
- **Complete Documentation Suite** - Comprehensive user guides, FAQ section, and developer documentation for export functionality
- **Data Completeness Parity** - All 22 annotation fields available across all export formats ensuring comprehensive coverage
- **Robust Error Recovery** - Export operations continue processing even when individual cases encounter errors
- **Smart File Organization** - Automatic descriptive filename generation with timestamps and case identifiers

## [2025-09-15] - *[Release v0.9.15.1-beta](https://github.com/striae-org/striae/releases/tag/v0.9.15.1-beta)*

- **Interactive Box Annotation System** - Complete implementation of interactive box drawing tool with real-time annotation capabilities
- **Box Color Selection Interface** - Dynamic color selector with preset colors and custom color wheel for box annotations
- **Enhanced PDF Integration** - Box annotations now render accurately in PDF reports with exact positioning and color preservation
- **Improved UI/UX Components** - Refined toolbar integration, z-index management, and transparent annotation styling
- **Robust Position Management** - Fixed box annotation positioning with absolute coordinate system for stable multi-box support

## [2025-09-15] - *[Release v0.9.15-beta](https://github.com/striae-org/striae/releases/tag/v0.9.15-beta)*

- **Security & Authentication Enhancements** - Comprehensive MFA improvements with phone validation, demo number prevention, and enhanced user validation systems
- **Complete Account Deletion System** - Major feature implementation with email notifications, safety measures, demo account protection, and auto-logout functionality
- **User Management & Permissions** - Demo account system with permission-based access control, account limits, and enhanced profile management
- **Infrastructure & Developer Experience** - Documentation updates, Open Collective integration, automatic versioning, and comprehensive code cleanup
- **Technical Improvements** - TypeScript conversions, worker enhancements, security policy updates, and automated workflow improvements
- **UI/UX Enhancements** - Toast notification system, PDF generation improvements, navigation enhancements, and mobile responsiveness upgrades

## [2025-09-10] - *[Release v0.9.10-beta](https://github.com/striae-org/striae/releases/tag/v0.9.10-beta)*

- **Authentication System Enhancements** - Simplified login process with email validation and disabled profile email updates for security
- **Documentation & Developer Experience** - Comprehensive developer documentation with installation guides, architecture diagrams, and development protocols
- **UI/UX Improvements** - Enhanced homepage with developer information, consistent card hover effects, and LinkedIn icon integration
- **Code Quality & Maintenance** - Extensive code cleanup, dependency updates, and unified deployment scripts
- **Security & Configuration** - Improved Turnstile keys portability, removed redundant configurations, and enhanced gitignore specifications
- **Developer Tools** - Added Patreon widget development, console flair enhancements, and internal developer workflow improvements
- **Bug Fixes & Optimizations** - Fixed installation guide issues, removed deprecated mobile references, and streamlined configuration management

## [2025-09-06] - *[Release v0.9.06-beta](https://github.com/striae-org/striae/releases/tag/v0.9.06-beta)*

- **Installation & Setup Improvements** - Comprehensive installation guide and simplified setup process
- **Worker Infrastructure Enhancements** - Security hardening and configuration portability improvements
- **UI/UX Enhancements** - Added homepage about section, improved mobile responsiveness, and enhanced authentication components
- **Security & Data Management** - Free email domain filtering and enhanced authentication security measures
- **Community & Project Management** - Patreon integration, GitHub issue templates, and Code of Conduct
- **Bug Fixes & Optimizations** - PostCSS fixes, configuration improvements, and dependency updates
- **Developer Experience** - Enhanced documentation, worker optimizations, and deployment script improvements

## [2025-09-01] - *[Release v0.9.0-beta](https://github.com/striae-org/striae/releases/tag/v0.9.0)*

- Global CSS corrections and cleanup
- Numerous code cleanups and adjustments
- Created a footer modal component for in-app support (main app is now a single-screen interface)
- Refactored sidebar components to reduce redundancy and improve maintainability
- Created user's guide documentation

## [2025-08-26] - *Pre-Beta Release*

## 🔐 Authentication & Security Enhancements

### Multi-Factor Authentication (MFA)

- ✅ **Complete MFA system** with phone-based verification

### Login System Improvements

- ✅ **Simplified login process (email & password only)** with better error handling

---

## 🎨 UI/UX Improvements

### Visual Enhancements

- ✅ **Firefox compatibility** - Fixed text color issues
- ✅ **Consistent branding** - Logo links across all landing pages
- ✅ **Professional icons** - Replaced emoji in password fields with custom SVG icons
- ✅ **Improved form interactions** and visual feedback

---

## 📄 PDF Generation & Reporting

### New PDF Functionality

- ✅ **Complete PDF generation system**
- ✅ **Dynamic filename generation** for reports
- ✅ **Toast notifications** for PDF generation status
- ✅ **Enhanced button components** for PDF actions and status

---

## 📋 Content & Legal Updates

### Documentation

- ✅ **Simplified Terms & Conditions and Privacy Policy Sheets**
- ✅ **Compliance updates** for data control terms

---

## 🐛 Bug Fixes & Optimizations

### Canvas & Annotation System

- ✅ **Memory management** - Cleanup on component unmount
- ✅ **State management** - Clear displays on case/image changes
- ✅ **Improved interaction handling**

### General Improvements

- ✅ **Index labeling** to include numbers OR letters
- ✅ **Notes display** fixes
- ✅ **Form enhancements**
- ✅ **Link corrections** across application

---

## 📊 Development Statistics

- **94 commits** in 4 days
- **7 major feature areas** enhanced
- **3 new components** created
- **1 new worker module** implemented

---

## 🎯 Key Highlights

| Feature | Impact | Status |
|---------|--------|--------|
| **MFA Implementation** | 🔒 Major security enhancement | ✅ Complete |
| **PDF Generation** | 📄 New core functionality | ✅ Complete |
| **UI Modernization** | 🎨 Better user experience | ✅ Complete |
| **Worker Infrastructure** | ⚡ Performance & scalability | ✅ Complete |
| **Code Quality** | 🛡️ SSR compatibility & error handling | ✅ Complete |

---

## [2025-08-23]

### ✨ Feature Additions

- Annotations display completed!

### 🔒 Security Enhancements

- Replaced Cloudflare Zero Trust with registration password gateway
- Removed Google-linked sign-in
- Corrected Manage Profile to verify new email addresses before updating from old email address
- Added an inactivity timer to automatically sign user out after certain period of inactivity

#### 🐛 Bug Fixes

- Renaming cases bug: Saved notes did not transfer over to the new case number correctly. This operation was fixed.
- Clear canvas on image delete: Clear the canvas of any images when a single file is deleted.

#### 🎨 Interface Improvements

- Added a "Rename/Delete Case" button to hide critical functions behind an extra gateway

#### 🔧 Minor Updates

- Multiple wording and interface adjustments

---

## [2025-08-17]

### ✅ Added

- Cloudflare Zero Access Gateway integration for enhanced security and streamlined authentication.
- Minor description/wording updates throughout the app for clarity.
- Various code corrections and minor bug fixes for reliability.

#### 🚧 Planned

- Annotations display on the canvas
- Conversion to Adobe PDF

#### ✅ Stable Features

- Firebase Authentication methods
- Case management
- File upload & management
- Notes creation & management

---

## [2025-08-10] - Development Update

### Striae Development Indefinitely Suspended

Some of you know that at the end of 2024, I’d been working on a personal project close to my heart — Striae, a Firearms Examiner’s Comparison Companion.

The goal was simple but powerful: give firearms examiners a secure, organized way to upload bullet and cartridge case comparison images, link them to specific cases, and make notations directly tied to each image.

#### ✅ Core Features Built

- User login & account management
- Case management for organized workflows
- Upload images tied to cases
- Make and store notations linked to each specific image

#### 🔒 Security Measures Implemented

- 🔐 Firebase Authentication for login and admin management
- 🔐 Encryption in transit and at rest
- 🔐 Data segregation/isolation
- 🔐 Controlled access & monitoring
- 🔐 Comprehensive audit trail system for forensic accountability

#### 🔮 Future Outlook

Unfortunately, a few significant life upheavals forced me to pause development before reaching the printing tools and live display functions I had envisioned.

Rather than let it fade away in a private, closed folder, I’ve opened the code archive to the public. Every project that I had built in the previous few years has been founded on the principle of contributing to the public good. My hope is that someone with the skills and interest might pick up where I left off — improve it, adapt it, and maybe even take Striae further than I imagined. If that sounds like you (or you know someone who'd be interested), the code is now available for anyone to view and build upon. If circumstances allow, I may resume development in the future and take this to the finish line.
