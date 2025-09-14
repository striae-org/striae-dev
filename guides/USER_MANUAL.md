# Striae User Manual

## Table of Contents

1. [Getting Started](#getting-started)
   - [Account Registration](#account-registration)
   - [Logging In](#logging-in)
   - [Multi-Factor Authentication](#multi-factor-authentication)
2. [Account Types](#account-types)
   - [Demo Accounts](#demo-accounts)
   - [Full Access Accounts](#full-access-accounts)
3. [Dashboard Overview](#dashboard-overview)
   - [Main Interface](#main-interface)
   - [Navigation](#navigation)
4. [Case Management](#case-management)
   - [Creating New Cases](#creating-new-cases)
   - [Managing Existing Cases](#managing-existing-cases)
   - [Case Limitations](#case-limitations)
5. [Image Annotation](#image-annotation)
   - [Uploading Images](#uploading-images)
   - [Annotation Tools](#annotation-tools)
   - [Working with Annotations](#working-with-annotations)
6. [Notes and Documentation](#notes-and-documentation)
   - [Adding Case Notes](#adding-case-notes)
   - [Managing Documentation](#managing-documentation)
7. [PDF Report Generation](#pdf-report-generation)
   - [Creating Reports](#creating-reports)
   - [Report Content](#report-content)
8. [Account Management](#account-management)
   - [Profile Settings](#profile-settings)
   - [Password Management](#password-management)
   - [Account Deletion](#account-deletion)
9. [Security Features](#security-features)
   - [Session Management](#session-management)
   - [Data Protection](#data-protection)
10. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Getting Support](#getting-support)

---

## Getting Started

### Account Registration

To begin using Striae, you'll need to create an account:

1. **Visit the Registration Page**: Navigate to the Striae application
2. **Provide Required Information**:
   - **Email Address**: Must be a work or institutional email (personal email providers like Gmail, Yahoo, etc. are not permitted)
   - **Password**: Must meet security requirements (minimum 10 characters, mix of letters, numbers, and symbols)
   - **Full Name**: Your first and last name
   - **Company/Laboratory**: Your organization name
3. **Complete Email Verification**: Check your email for a verification link
4. **Set Up Multi-Factor Authentication**: Follow the prompts to configure SMS-based MFA

### Logging In

1. **Enter Credentials**: Use your registered email and password
2. **Complete MFA**: Enter the SMS verification code sent to your phone
3. **Access Dashboard**: You'll be directed to the main application interface

### Multi-Factor Authentication

Striae requires MFA for enhanced security:

- **Setup**: During registration, you'll configure SMS verification
- **Login Process**: Every login requires an SMS code
- **Phone Number**: Must be a valid mobile number capable of receiving SMS

---

## Account Types

### Demo Accounts

Demo accounts provide limited access for evaluation purposes:

**Features Available**:
- Limited case creation (typically 2-3 cases)
- Limited file uploads per case (typically 5-10 files)
- Full annotation functionality
- PDF report generation
- Case and note management

**Restrictions**:
- Cannot delete account (for security and demo stability)
- Limited storage capacity
- May have session time restrictions

**Identifying Demo Status**: Demo accounts will see usage limits displayed in the interface

### Full Access Accounts

Full access accounts have complete functionality:

**Features Available**:
- Unlimited case creation
- Unlimited file uploads
- All annotation and reporting features
- Account deletion capability
- Extended session times

**Account Upgrade**: Contact your system administrator to upgrade from demo to full access

---

## Dashboard Overview

### Main Interface

The Striae dashboard consists of several key areas:

1. **Header Bar**: Navigation, user menu, and system controls
2. **Sidebar**: Case management and file organization
3. **Main Canvas**: Image display and annotation area
4. **Toolbar**: Annotation tools and controls
5. **Notes Panel**: Case documentation and notes

### Navigation

- **Home**: Return to main dashboard
- **Cases**: Access case management
- **Profile**: Account settings and preferences
- **Sign Out**: Secure logout

---

## Case Management

### Creating New Cases

1. **Access Case Sidebar**: Click the case management area
2. **New Case Button**: Select "Create New Case"
3. **Case Number**: Enter a unique case identifier
   - Must be unique across the system
   - Recommended format: Year-Department-SequenceNumber (e.g., 2025-LAB-001)
4. **Validation**: System checks for duplicates
5. **Confirmation**: Case is created and ready for use

### Managing Existing Cases

- **Switch Cases**: Select from the dropdown list of your cases
- **Rename Cases**: Use the edit option to modify case names
- **Delete Cases**: Remove cases and all associated data (permanent action)
- **Case History**: View creation dates and modification history

### Case Limitations

**Demo Accounts**:
- Limited number of total cases
- Warnings displayed when approaching limits

**Full Accounts**:
- No case limitations
- Unlimited storage capacity

---

## Image Annotation

### Uploading Images

1. **Select Active Case**: Ensure correct case is selected
2. **Upload Interface**: Drag and drop or click to browse
3. **Supported Formats**: PNG, JPEG, GIF, WebP, SVG
4. **File Limitations**: Demo accounts have per-case file limits

### Annotation Tools

Striae provides comprehensive annotation tools:

**Available Tools**:
- **Selection**: Navigate and select existing annotations
- **Rectangle**: Draw rectangular annotation areas
- **Circle**: Create circular annotations
- **Arrow**: Add directional indicators
- **Text**: Insert text labels and descriptions
- **Freehand**: Draw custom shapes and lines

**Tool Features**:
- **Color Selection**: Choose from predefined color palette
- **Layering**: Annotations stack in creation order
- **Editing**: Modify existing annotations
- **Deletion**: Remove unwanted annotations

### Working with Annotations

- **Creating**: Select tool, draw on image
- **Selecting**: Click existing annotations to modify
- **Moving**: Drag annotations to reposition
- **Resizing**: Use handles to adjust size
- **Properties**: Modify colors and styles
- **Visibility**: Toggle annotation visibility for reports

---

## Notes and Documentation

### Adding Case Notes

1. **Notes Sidebar**: Access the notes panel
2. **Create Notes**: Add timestamped documentation
3. **Rich Text**: Format text with basic styling
4. **Organization**: Notes are stored chronologically
5. **Search**: Find specific notes within cases

### Managing Documentation

- **Edit Notes**: Modify existing documentation
- **Delete Notes**: Remove unnecessary entries
- **Export**: Include notes in PDF reports
- **Version History**: Track changes over time

---

## PDF Report Generation

### Creating Reports

1. **Prepare Case**: Ensure all annotations and notes are complete
2. **Generate Report**: Click the PDF generation button
3. **Processing**: System compiles images, annotations, and notes
4. **Download**: PDF is automatically downloaded when ready

### Report Content

Generated reports include:

**Header Information**:
- Case number and details
- Examiner information (your name and organization)
- Generation timestamp

**Image Content**:
- High-resolution case images
- All visible annotations
- Annotation legends and descriptions

**Documentation**:
- Case notes and observations
- Methodology descriptions
- Conclusions and findings

**Footer Information**:
- Page numbers
- Organization/laboratory name
- Professional standards compliance

---

## Account Management

### Profile Settings

Access account management through the user menu:

1. **User Menu**: Click your name/avatar in the header
2. **Manage Profile**: Select profile management option

**Editable Information**:
- **Display Name**: Update your preferred name
- **Password**: Change account password with re-authentication

**Read-Only Information**:
- **Email Address**: Contact administrator to change
- **Company/Laboratory**: Contact administrator to update
- **Account Type**: Demo or Full Access status

### Password Management

**Changing Password**:
1. Open profile management
2. Select password change option
3. Re-authenticate with current password
4. Enter new password (must meet security requirements)
5. Confirm changes

**Password Requirements**:
- Minimum 10 characters
- Mix of uppercase and lowercase letters
- Include numbers and special characters
- Cannot reuse recent passwords

### Account Deletion

Account deletion policies vary by account type:

#### For Full Access Accounts

**Deletion Process**:
1. **Access Deletion**: Profile menu → Account Management → Delete Account
2. **Warning Review**: Read and understand deletion consequences
3. **Dual Confirmation**: Enter both your User ID and email address exactly
4. **Final Confirmation**: Click "Delete Account Permanently"
5. **Email Notification**: Confirmation emails are sent
6. **Automatic Logout**: System logs you out after 3 seconds

**What Gets Deleted**:
- All account information and profile data
- All cases and associated files
- All annotations and notes
- All generated reports
- Email address is permanently disabled

**Important Notes**:
- **Irreversible Process**: Account deletion cannot be undone
- **Complete Data Loss**: All work is permanently removed
- **Email Disabled**: The email address cannot be reused for new accounts

#### For Demo Accounts

**Deletion Restrictions**:
- Demo accounts cannot be deleted
- This protects shared demo credentials
- Ensures demo functionality remains available for evaluation
- Maintains system stability for trial users

**Alternative Options for Demo Users**:
- **Data Clearing**: Contact administrator to reset demo data
- **Account Upgrade**: Request upgrade to full access account
- **New Account**: Register for a full access account with different email

**Security Rationale**:
Demo account deletion restrictions prevent:
- Accidental loss of shared demo environments
- Disruption of evaluation processes
- Unauthorized modification of demo credentials

---

## Security Features

### Session Management

**Inactivity Timeout**:
- Sessions automatically expire after periods of inactivity
- Warning notifications appear before timeout
- Extend session option available
- Secure logout on timeout

**Multi-Factor Authentication**:
- Required for every login
- SMS-based verification codes
- Phone number validation
- Secure token generation

### Data Protection

**Encryption**:
- All data transmitted over encrypted connections
- Images stored with secure access controls
- User data protected in cloud storage

**Access Controls**:
- Account-based data isolation
- Secure API authentication
- Worker-based security architecture
- CORS protection for web requests

---

## Troubleshooting

### Common Issues

**Login Problems**:
- **Invalid Credentials**: Verify email and password accuracy
- **MFA Issues**: Ensure phone number is correct and can receive SMS
- **Account Locked**: Contact administrator after multiple failed attempts

**Upload Issues**:
- **File Format**: Ensure images are in supported formats (PNG, JPEG, GIF, WebP, SVG)
- **File Size**: Large images may take longer to process
- **Storage Limits**: Demo accounts have file upload restrictions

**Performance Issues**:
- **Slow Loading**: Check internet connection stability
- **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)
- **Cache Issues**: Clear browser cache if experiencing unusual behavior

**Annotation Problems**:
- **Tool Selection**: Ensure correct annotation tool is selected
- **Layer Issues**: Check annotation visibility settings
- **Save Problems**: Verify annotations are saved before generating reports

### Getting Support

**Self-Service Resources**:
- Review this user manual for detailed instructions
- Check browser console for error messages
- Verify account permissions and limitations

**Administrator Contact**:
- **Technical Issues**: Contact your system administrator
- **Account Problems**: Request assistance with account settings
- **Feature Requests**: Submit enhancement suggestions
- **Bug Reports**: Provide detailed descriptions of issues

**Emergency Support**:
- **Data Loss**: Immediately contact administrator
- **Security Concerns**: Report suspicious activity
- **System Outages**: Check with administrator for status updates

---

## Best Practices

### Case Organization

- **Consistent Naming**: Use standardized case number formats
- **Regular Backups**: Generate PDF reports regularly
- **Documentation**: Maintain detailed notes throughout examination
- **File Management**: Organize images logically within cases

### Security Practices

- **Strong Passwords**: Use unique, complex passwords
- **Secure Logout**: Always log out when finished
- **Device Security**: Don't save passwords on shared computers
- **MFA Protection**: Keep phone number updated for SMS delivery

### Quality Assurance

- **Review Work**: Double-check annotations and notes before generating reports
- **Peer Review**: Have colleagues review critical examinations
- **Standard Procedures**: Follow organizational protocols
- **Documentation Standards**: Maintain professional documentation practices

---

*This user manual covers the core functionality of Striae. For technical support or additional questions, please contact your system administrator or refer to the developer documentation for advanced features.*