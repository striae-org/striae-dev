# Audit Trail System - User Guide

## Overview

Striae automatically tracks all your actions to create a comprehensive audit trail for forensic accountability. This system logs everything you do - from uploading files to creating annotations - ensuring complete traceability for legal compliance.

## What Gets Tracked

The audit trail system automatically records:

### 📁 Case Management Activities
- Creating new cases
- Renaming cases
- Deleting cases

### 📤 File Operations
- Uploading images to cases
- Viewing/accessing files
- Deleting files from cases

### ✏️ Annotation Work
- Creating new annotations (notes and box annotations)
- Editing existing annotations
- Deleting annotations

### 👤 User Activities
- Logging into Striae
- Logging out
- Updating your profile information
- Password resets

### 📦 Case Export/Import
- Exporting case packages for sharing
- Importing case packages from other examiners
- Creating confirmations of other examiners' work

### 📄 Document Generation
- Generating PDF reports from your annotations

### 🔒 Security Events
- Failed login attempts
- Blocked actions (like trying to confirm your own work)
- File integrity validation results

## Accessing Your Audit Trail

### Opening the Audit Viewer

1. **From Manage Profile**, look for the 'View My Audit Trail' button
2. **Click** to open the Audit Trail Viewer
3. The viewer opens in a modal window overlay

---

1. **From the Case Actions Menu**, look for the purple 'Audit Trail' button
2. **Click** to open the Audit Trail Viewer
3. The viewer opens in a modal window overlay

### Understanding the Interface

The Audit Viewer has several sections:

#### Header Section
- **Title**: Shows "My Audit Trail" or case-specific title
- **Export Buttons**: Download your audit data
- **Close Button**: Exit the viewer

#### Summary Section
- **User Information**: Your name, email, lab/company, and User ID
- **Activity Statistics**: Total events, successful actions, failed actions
- **Date Range**: Time period of displayed data

#### Filters Section
Use these controls to narrow down what you see:

- **Date Range**: Choose from preset ranges (Last 24 hours, Last 7 days, Last 30 days) or set custom dates
- **Case Number**: Filter to see only activities for a specific case
- **Action Type**: Filter by what type of action was performed
- **Result Status**: Show only successful, failed, or blocked actions

#### Entries List
Shows your actual audit entries with:
- **Timestamp**: When the action occurred
- **Action**: What you did (e.g., "file-upload", "annotation-create")
- **Result**: Whether it was successful, failed, or blocked
- **Details**: Specific information about the action
- **Case Information**: Which case was affected (if applicable)

## Using Filters

### Date Range Filtering

**Preset Options:**
- **Last 24 hours**: Recent activity from today
- **Last 7 days**: This week's work
- **Last 30 days**: This month's activity (default)
- **All Time**: Everything (may be slow for long-term users)
- **Custom Range**: Set your own start and end dates

**To use custom dates:**
1. Select "Custom Range" from the dropdown
2. Enter your start date (YYYY-MM-DD format)
3. Enter your end date (YYYY-MM-DD format)
4. Click "Apply Date Range"

**To clear date range filter:**
1. Click the 'Clear Dates' button next to the date range fields

### Case Number Filtering

**To filter by case:**
1. Enter the case number in the "Case Number" field
2. Click the 'Filter' button or press Enter
3. The list will update to show only activities for that case

**To clear case filter:**
1. Click the 'Clear' button next to the case number field

### Action Type Filtering

Filter by the type of action:
- **All**: Show everything (default)
- **file-upload**: Only file uploads
- **annotation-create**: Only new annotations
- **case-create**: Only new cases
- **confirm**: Only confirmation activities
- **export**: Only case exports
- And more...

### Result Status Filtering

Filter by outcome:
- **All**: Show everything (default)
- **success**: Only successful actions
- **failure**: Only failed actions
- **blocked**: Only actions blocked by security
- **warning**: Only actions that completed with warnings

## Exporting Your Audit Trail

You can download your audit trail data in multiple formats:

### CSV Export
**Best for:** Spreadsheet analysis, sharing with administrators

**To export CSV:**
1. Apply any filters you want (optional)
2. Click "CSV" in the header
3. File automatically downloads as `striae-audit-user-{your-id}-{timestamp}.csv`

**CSV includes:** Timestamp, action details, case numbers, file information, performance metrics

### JSON Export
**Best for:** Technical analysis, system integration

**To export JSON:**
1. Apply any filters you want (optional)  
2. Click "JSON" in the header
3. File automatically downloads as `striae-audit-user-{your-id}-{timestamp}.json`

**JSON includes:** Complete technical details, all metadata, structured format

### Summary Report
**Best for:** Human-readable compliance reports

**To generate report:**
1. Apply any filters you want (optional)
2. Click "Report" in the header  
3. File downloads as `striae-audit-summary-{case}-{timestamp}.txt`

**Report includes:** Activity statistics, timeline summary, compliance status

## Understanding Audit Entries

### Entry Information

Each audit entry shows:

#### Basic Information
- **Timestamp**: Exact date and time (in your local timezone)
- **Action**: What you did (using technical action names)
- **Result**: Outcome (success, failure, blocked, warning)
- **User Email**: Your email address

#### File-Related Details
When you work with files, entries include:
- **File Name**: Original filename
- **File Size**: Size in megabytes
- **File Type**: Image, document, etc.
- **Case Number**: Which case contains the file

#### Annotation Details
When you create or edit annotations:
- **Annotation Type**: Notes or Box
- **Tool Used**: Notes Sidebar or Box Tool
- **Notes Details**: Text content of notes
- **Box Position**: Where on the image (for box annotations, shows color, coordinates, and dimensions)

#### Performance Information
- **Processing Time**: How long the action took
- **Validation Steps**: Security checks performed

#### Security Information
- **File Integrity**: Whether uploaded files passed security checks
- **Authentication Status**: Login verification results
- **Access Permissions**: Whether you had permission for the action

### Common Action Types

| Action | What It Means |
|--------|---------------|
| `user-login` | You logged into Striae |
| `case-create` | You created a new case |
| `file-upload` | You uploaded an image to a case |
| `annotation-create` | You created a new annotation |
| `annotation-edit` | You modified an existing annotation |
| `export` | You exported a case package |
| `import` | You imported a case package |
| `confirm` | You created a confirmation |
| `pdf-generate` | You generated a PDF report |

### Result Status Meanings

| Status | What It Means |
|--------|---------------|
| `success` | Action completed successfully |
| `failure` | Action failed due to an error |
| `blocked` | Action was prevented by security rules |
| `warning` | Action completed but with issues |

## Data Storage and Retention

### Where Your Data Is Stored
- **Location**: Secure Cloudflare R2 storage with 99.999999999% (eleven 9s) annual durability¹
- **Encryption**: AES-256 encryption with GCM mode at rest²
- **Organization**: Files organized by user and day
- **Access**: Only you can access your own audit data

### Data Retention
- **Policy**: All audit data is kept permanently
- **Purpose**: Forensic compliance and legal evidence requirements  
- **Export**: You can export your data at any time

## Privacy and Access

### Who Can See Your Audit Trail
- **You**: Full access to your own audit data
- **Other Users**: Cannot see your audit trail
- **System Administrators**: May have access for system maintenance, reporting, or compliance audits
- **Legal Requirements**: Data may be accessed if required by law

### Data Security
- **User Isolation**: Your data is completely separate from other users
- **Encrypted Storage**: All data encrypted with AES-256 with GCM mode²
- **Tamper-Proof**: Audit entries cannot be modified once created

## Troubleshooting

### Audit Entries Not Showing

**Problem**: You performed actions but don't see them in the audit trail

**Solutions:**
1. **Check Date Range**: Make sure your date filter includes when you did the work
2. **Clear Filters**: Remove case number or action filters that might be hiding entries
3. **Refresh**: Close and reopen the audit viewer
4. **Check Case Number**: Ensure the case number filter is correct (if used)

### Slow Loading

**Problem**: Audit trail takes a long time to load

**Solutions:**
1. **Use Date Filters**: Select a shorter time range (like "Last 7 days")
2. **Apply Case Filter**: Focus on one specific case
3. **Check Internet**: Ensure stable connection to Cloudflare servers
4. **Close Other Tabs**: Free up browser memory

### Export Issues

**Problem**: Export files are empty or downloads fail

**Solutions:**
1. **Check Pop-ups**: Ensure your browser allows downloads from Striae
2. **Try Different Format**: If CSV fails, try JSON export
3. **Reduce Date Range**: Export smaller time periods
4. **Clear Browser Cache**: Refresh your browser data

### Filter Not Working

**Problem**: Filters don't seem to affect the displayed entries

**Solutions:**
1. **Press Enter or Click 'Filter'**: After typing in filter fields, click the button or press Enter to apply
2. **Check Spelling**: Ensure case numbers are typed correctly
3. **Use Exact Match**: Case numbers must match exactly
4. **Clear Other Filters**: Remove conflicting filters

## Best Practices

### Regular Review
- **Weekly**: Check your audit trail weekly to verify accuracy
- **Before Court**: Export relevant audit data before legal proceedings
- **After Major Work**: Review audit trail after completing significant cases

### Filter Usage
- **Start Broad**: Begin with wide date ranges, then narrow down
- **One Filter**: Use one filter type at a time for clarity
- **Document Filters**: Note which filters you used when exporting data

### Export Strategy
- **Multiple Formats**: Export in both CSV (for analysis) and JSON (for backup)
- **Regular Exports**: Export audit data monthly for your records
- **Case-Specific**: Export case-specific audit trails when closing cases

### Data Management
- **Consistent Case Numbers**: Use consistent case numbering for easier filtering
- **Meaningful Filenames**: Use descriptive filenames for easier audit trail reading
- **Regular Cleanup**: Review and organize your exported audit files

## Getting Help

If you need assistance with the audit trail system:

1. **Check This Guide**: Review the relevant sections above
2. **Try Different Approaches**: Use different filters or export formats
3. **Contact Support**: Reach out to [Striae technical support](https://dev.striae.org/support)
4. **Document Issues**: Note exactly what you were doing when problems occurred

The audit trail system is designed to be transparent and comprehensive, giving you complete visibility into your forensic examination work while ensuring legal compliance and accountability.

---

## References

¹ Cloudflare R2 provides 99.999999999% (eleven 9s) annual durability through automatic replication across their infrastructure:

- [Cloudflare R2 Durability](https://developers.cloudflare.com/r2/reference/durability/)

² Cloudflare R2 and KV storage use AES-256 encryption with GCM (Galois/Counter Mode) for all data at rest:

- [Cloudflare R2 Data Security](https://developers.cloudflare.com/r2/reference/data-security/) - Details on AES-256 encryption with GCM mode for object storage
- [Cloudflare KV Data Security](https://developers.cloudflare.com/kv/reference/data-security/) - Details on AES-256 encryption with GCM mode for key-value storage

**Additional Security and Compliance Resources:**

- [NIST Advanced Encryption Standard (AES)](https://www.nist.gov/publications/advanced-encryption-standard-aes) - Official specification for AES encryption
- [NIST FIPS 197](https://csrc.nist.gov/publications/detail/fips/197/final) - Federal approval and technical specifications for AES
- [Cloudflare Trust Hub](https://www.cloudflare.com/trust-hub/) - Comprehensive security and compliance information
- [Cloudflare Compliance Resources](https://www.cloudflare.com/trust-hub/compliance-resources/) - Industry certifications and compliance documentation

---

*Need additional help? Don't hesitate to reach out to our [support team](https://www.striae.org/support). We're here to ensure you have secure and seamless access to Striae's features.*
