# Striae Case Management Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating Cases](#creating-cases)
4. [Loading Existing Cases](#loading-existing-cases)
5. [File Management](#file-management)
6. [Case Organization](#case-organization)
7. [Advanced Case Operations](#advanced-case-operations)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Overview

Striae's case management system allows you to organize your forensic image analysis work into individual cases. Each case can contain multiple images, annotations, and notes, providing a structured workflow for your investigations.

### Key Features
- **Individual Case Organization**: Each case is isolated with its own images and data
- **Smart Case Numbering**: Alphanumeric case numbers with intelligent sorting
- **File Management**: Upload, organize, and delete images within cases
- **Case Operations**: Rename, delete, and transfer cases as needed
- **Batch Management**: View and manage all your cases in one place

## Getting Started

### Accessing Case Management
1. **Login to Striae** using your authenticated account
2. **Locate the Case Management Panel** on the left sidebar
3. **Case Input Field**: Enter case numbers here
4. **Load/Create Button**: Creates new cases or loads existing ones
5. **List All Cases**: Browse all your existing cases

### Understanding Case Numbers
- **Format**: Alphanumeric characters and hyphens only (A-Z, 0-9, -)
- **Length**: Maximum 25 characters
- **Examples**: 
  - `2025-001`
  - `CASE-123`
  - `HOMICIDE-2025-JAN-15`
  - `CYBER-FRAUD-001`

## Creating Cases

### Step-by-Step Case Creation
1. **Enter Case Number**: Type your desired case number in the input field
2. **Click Load/Create Case**: The system will:
   - Check if the case already exists
   - If it exists: Load the existing case
   - If new: Create a fresh case with that number
3. **Success Confirmation**: You'll see "Case [number] created successfully!"

### Case Number Validation
The system automatically validates your case number:
- ✅ **Valid**: `2025-001`, `CASE123`, `TEST-CASE-A1`
- ❌ **Invalid**: `case@123` (special chars), `this-case-number-is-way-too-long-for-the-system` (too long)

### What Happens When You Create a Case
- **Case File Created**: A data structure is established in the system
- **User Record Updated**: The case is added to your personal case list
- **File Storage Initialized**: Ready to accept image uploads
- **Notes System Prepared**: Annotation system activated for the case

## Loading Existing Cases

### Quick Load Methods

#### Method 1: Direct Input
1. Type the exact case number in the input field
2. Click "Load/Create Case"
3. The case loads with all associated files

#### Method 2: Browse All Cases
1. Click "List All Cases" button
2. **Cases Modal** opens showing:
   - All your cases in sorted order
   - Pagination (10 cases per page)
   - Current case highlighted
3. Click on any case to load it instantly

### Case List Features
- **Smart Sorting**: Cases sorted numerically first, then alphabetically
  - Example order: `1`, `2`, `10`, `CASE-A`, `CASE-B`
- **Pagination**: Navigate through large case lists easily
- **Current Case Highlight**: Your active case is clearly marked
- **Quick Select**: Single click to switch cases

## File Management

### Supported File Types
- **PNG**: Portable Network Graphics
- **JPEG/JPG**: Joint Photographic Experts Group
- **GIF**: Graphics Interchange Format
- **WEBP**: Google's modern image format
- **SVG**: Scalable Vector Graphics

### File Upload Process
1. **Select Active Case**: Ensure you have a case loaded
2. **Choose File**: Click "Upload Image" and select your file
3. **Validation**: System checks file type and size (10MB limit)
4. **Upload Progress**: Real-time upload percentage displayed
5. **Processing**: File optimization and storage
6. **Ready**: File appears in the case file list

### File Management Features

#### Upload Restrictions
- **File Size**: Maximum 10MB per file
- **File Types**: Only supported image formats accepted
- **Storage**: Secure cloud storage with redundancy

#### File Operations
- **Select Image**: Click any file to load it into the viewer
- **Delete Files**: Click the "×" button with confirmation dialog
- **File Display**: Shows original filename and upload date

### Error Handling
- **Invalid File Type**: Clear error message with supported formats
- **File Too Large**: Size limit notification
- **Upload Failure**: Automatic retry and error reporting
- **Auto-Clear Errors**: Error messages disappear after 3 seconds

## Case Organization

### Case Status Indicators
- **No Case Selected**: "Create or select a case to view files"
- **Empty Case**: "No files found for [case-number]"
- **Active Case**: Shows case number and file count
- **Loading States**: "Loading..." during operations

### File List Display
Each file shows:
- **Original Filename**: The name you uploaded
- **Upload Date**: When the file was added
- **Delete Option**: Quick removal with confirmation
- **Selection**: Click to load image for analysis

### Success Feedback
- **Case Created**: "Case [number] created successfully!"
- **Case Loaded**: "Case [number] loaded successfully!"
- **Case Deleted**: "Case [number] deleted successfully!"
- **Auto-Clear**: Success messages disappear after 3 seconds

## Advanced Case Operations

### Renaming Cases

#### When to Rename
- **Case Number Changes**: Investigation requirements change
- **Standardization**: Align with department numbering
- **Correction**: Fix typos or improve clarity

#### Rename Process
1. **Expand Case Actions**: Click "Rename/Delete Case"
2. **Enter New Number**: Type the new case number
3. **Validation**: System checks format and availability
4. **Transfer Data**: All files and notes automatically transferred
5. **Cleanup**: Old case data removed completely

#### What Gets Transferred
- ✅ **Case Metadata**: Creation date and case information
- ✅ **All Image Files**: Complete file history preserved
- ✅ **Image Notes**: All annotations and analysis data
- ✅ **File Associations**: Maintains image-to-notes relationships

### Deleting Cases

#### Permanent Deletion Warning
⚠️ **IMPORTANT**: Case deletion is permanent and cannot be undone!

#### Deletion Process
1. **Expand Case Actions**: Click "Rename/Delete Case"
2. **Delete Button**: Click "Delete Case"
3. **Confirmation Dialog**: System asks for final confirmation
4. **Complete Removal**: All data permanently deleted

#### What Gets Deleted
- 🗑️ **Case Record**: Removed from your case list
- 🗑️ **All Files**: Every image permanently deleted
- 🗑️ **All Notes**: All annotations and analysis data
- 🗑️ **System Data**: Complete cleanup of case infrastructure

### Bulk Case Management

#### List All Cases Modal
- **Comprehensive View**: See every case you've created
- **Search and Browse**: Navigate through large case collections
- **Quick Switch**: Instant case loading from the list
- **Case Count**: Total number of cases displayed

#### Case Sorting Logic
The system uses intelligent sorting:
1. **Numbers First**: Numerical comparison (1, 2, 10, not 1, 10, 2)
2. **Letters Second**: Alphabetical sorting for non-numeric parts
3. **Mixed Cases**: Numbers take priority over letters

## Troubleshooting

### Common Issues and Solutions

#### "Invalid case number format"
- **Problem**: Case number contains invalid characters
- **Solution**: Use only letters, numbers, and hyphens
- **Examples**: Remove spaces, special characters (@, !, etc.)

#### "Case already exists"
- **Problem**: Trying to rename to an existing case number
- **Solution**: Choose a different case number or load the existing case

#### "Failed to load files"
- **Problem**: Network or storage issue
- **Solutions**:
  1. Check your internet connection
  2. Refresh the page and try again
  3. Contact support if problem persists

#### "Upload failed"
- **Problem**: File upload interrupted or failed
- **Solutions**:
  1. Check file size (must be under 10MB)
  2. Verify file type is supported
  3. Check internet connection stability
  4. Try uploading again

#### "File size must be less than 10 MB"
- **Problem**: Image file is too large
- **Solutions**:
  1. Compress the image using image editing software
  2. Convert to a more efficient format (WEBP, PNG)
  3. Reduce image dimensions if appropriate for analysis

### Error Recovery

#### Auto-Recovery Features
- **Session Persistence**: Your case selection survives page refreshes
- **Error Auto-Clear**: Error messages automatically disappear
- **Upload Resume**: Failed uploads can be retried immediately
- **Data Integrity**: All operations are transaction-safe

#### Manual Recovery Steps
1. **Refresh Page**: Often resolves temporary connection issues
2. **Re-login**: Ensures authentication is current
3. **Clear Browser Cache**: Resolves cached data conflicts
4. **Contact Support**: For persistent technical issues

## Best Practices

### Case Naming Conventions

#### Recommended Formats
- **Date-Based**: `2025-01-15-001` (YYYY-MM-DD-sequence)
- **Department Standard**: `PD-2025-001` (department-year-number)
- **Case Type**: `HOMICIDE-2025-001` (type-year-sequence)
- **Mixed**: `CYBER-2025-JAN-001` (type-year-month-sequence)

#### Consistency Tips
- **Use Consistent Prefixes**: Stick to one naming convention
- **Include Dates**: Years help with organization and searching
- **Sequential Numbers**: Use leading zeros (001, 002, 010)
- **Avoid Spaces**: Use hyphens instead of spaces

### File Management Best Practices

#### File Organization
- **Descriptive Names**: Use clear, descriptive filenames before upload
- **Logical Order**: Upload files in the order you plan to analyze them
- **Regular Cleanup**: Remove unnecessary or duplicate files
- **Backup Important Cases**: Consider exporting critical analysis data

#### Image Quality Guidelines
- **Resolution**: Upload highest quality available for analysis
- **Format Choice**: 
  - PNG for screenshots and diagrams
  - JPEG for photographs
  - SVG for scalable graphics
- **File Size Balance**: Optimize size while maintaining analysis quality

### Workflow Recommendations

#### Efficient Case Management
1. **Plan Case Numbers**: Establish naming convention before starting
2. **Batch Operations**: Group similar cases together
3. **Regular Reviews**: Periodically review and organize old cases
4. **Documentation**: Keep case notes updated throughout investigation

#### Data Security Practices
- **Regular Backups**: Export important analysis data regularly
- **Access Control**: Log out when finished working
- **Case Privacy**: Each case is isolated and private to your account
- **Secure Connections**: Always use HTTPS for case access

### Performance Optimization

#### Large Case Management
- **File Limits**: Consider breaking very large investigations into multiple cases
- **Image Optimization**: Compress images when possible without losing detail
- **Periodic Cleanup**: Delete test cases and unnecessary files
- **Network Considerations**: Upload large files during off-peak hours

#### System Efficiency
- **Browser Performance**: Use modern browsers for best experience
- **Cache Management**: Clear browser cache if experiencing slow performance
- **Connection Quality**: Stable internet connection improves reliability
- **Session Management**: Regular saves prevent data loss

---

## Quick Reference

### Essential Commands
- **Create/Load Case**: Enter case number → Click "Load/Create Case"
- **Browse Cases**: Click "List All Cases"
- **Upload File**: Select case → Click "Upload Image" → Choose file
- **Delete File**: Click "×" next to filename → Confirm
- **Rename Case**: Expand case actions → Enter new name → Click "Rename"
- **Delete Case**: Expand case actions → Click "Delete Case" → Confirm

### File Requirements
- **Types**: PNG, JPEG, GIF, WEBP, SVG
- **Size**: Maximum 10MB
- **Names**: Original filename preserved

### Case Number Rules
- **Characters**: A-Z, 0-9, hyphens only
- **Length**: Maximum 25 characters
- **Format**: No spaces or special characters

---

*For technical support or additional questions about case management, please contact the Striae support team.*
