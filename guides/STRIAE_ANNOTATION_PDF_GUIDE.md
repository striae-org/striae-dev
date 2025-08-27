# Striae Image Annotation & PDF Generation Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Image Annotation Process](#image-annotation-process)
4. [Annotation Tools](#annotation-tools)
5. [PDF Generation](#pdf-generation)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Overview

Striae's annotation and PDF generation system allows forensic examiners to create professional documentation of firearms comparison analyses. The system provides comprehensive annotation tools and generates high-quality PDF reports suitable for court documentation and case files.

### Key Features

- **Visual Annotation Tools**: Add case numbers, class characteristics, index marks, and support levels directly on images
- **Professional PDF Output**: Generate court-ready reports with automatic formatting
- **Flexible Annotation System**: Toggle annotations on/off for different viewing needs  
- **Smart Filename Generation**: Automatic PDF naming based on case information
- **Real-time Preview**: See annotations as you work on the image

## Getting Started

### Prerequisites

1. **Active Case**: You must have a case loaded with at least one image
2. **Image Selected**: An image must be loaded in the viewer
3. **Notes Configured**: Basic annotation data should be entered

### Accessing the Annotation System

1. **Load a Case**: Use the case management panel to select your working case
2. **Upload/Select Image**: Choose an image from your case files
3. **Access Image Notes**: Click "Image Notes" to configure annotation data
4. **Use Toolbar**: The annotation toolbar appears above the image viewer

## Image Annotation Process

### Step 1: Configure Basic Information

Before annotating, set up your basic case information:

1. **Click "Image Notes"** to open the notes sidebar
2. **Enter Case Information**:
   - Left Side Case # (e.g., "2025-001")
   - Left Side Item # (e.g., "1A", "Evidence #1") 
   - Right Side Case # (e.g., "2025-002")
   - Right Side Item # (e.g., "1B", "K1")
3. **Select Font Color**: Choose visibility color for case numbers
4. **Save Notes**: Click "Save Notes" to store your configuration

### Step 2: Set Class Characteristics

Define the type of evidence being compared:

1. **Select Object Type**:
   - **Bullet**: For projectile comparisons
   - **Cartridge Case**: For fired cartridge case analysis
   - **Other**: For custom object types (specify in text field)

2. **Add Class Notes**: Describe observable class characteristics
   - Examples: "9mm Luger", ".45 ACP", "6 lands and grooves, right twist"

3. **Subclass Option**: Check if potential subclass characteristics are present
   - This adds a flashing warning indicator in the annotation system

### Step 3: Configure Index System

Choose how to mark specific comparison points:

#### Color Index (Recommended)
- **Select "Color" option**
- **Choose Index Color**: Pick a distinct color for marking comparison points
- **Visual Indication**: Creates a colored border around the entire image

#### Number/Letter Index
- **Select "Number/Letter" option** 
- **Enter Index Value**: Type alphanumeric identifier (e.g., "1", "A", "1A")
- **Display Position**: Shows prominently above the image

### Step 4: Set Support Level

Define your analytical conclusion:

- **Identification**: High degree of scientific certainty
- **Exclusion**: Evidence originated from different source
- **Inconclusive**: Insufficient detail for definitive conclusion

**Note**: Selecting "Identification" automatically enables the confirmation field for tech review signatures.

### Step 5: Add Additional Notes (Optional)

For detailed observations or complex analyses:

1. **Click "Additional Notes"**
2. **Enter Detailed Information**: 
   - Specific observations
   - Measurement details
   - Technical notes for peer review
3. **Save**: Notes appear in the final PDF report

## Annotation Tools

### Toolbar Overview

The annotation toolbar contains six main tools:

| Icon | Tool | Function | Keyboard |
|------|------|----------|----------|
| 🔢 | **Number** | Shows/hides case numbers on image | Toggle |
| 📋 | **Class** | Shows/hides class characteristic info | Toggle |
| 🎯 | **Index** | Shows/hides index marks (color/number) | Toggle |
| ✅ | **ID** | Shows/hides support level indicator | Toggle |
| 📝 | **Notes** | Shows/hides additional notes section | Toggle |
| 🖨️ | **Print** | Generates PDF with current annotations | Action |

### Using Annotation Tools

#### Case Number Annotations

**Activation**: Click the Number tool (🔢) in the toolbar

**What It Shows**:
- Left case number and item in top-left corner
- Right case number and item in top-right corner
- Uses your selected font color with high-contrast background
- Positioned to avoid obscuring critical image details

**Customization**:
- Font color selection in notes panel
- Automatic background adjustment for readability
- Professional typography for court documentation

#### Class Characteristics Display

**Activation**: Click the Class tool (📋) in the toolbar

**What It Shows**:
- Object type (Bullet, Cartridge Case, or custom)
- Class characteristic notes you entered
- Centered below the image for clear visibility

**Special Features**:
- **Subclass Warning**: If enabled, creates a flashing red "POTENTIAL SUBCLASS" indicator
- **Flash Pattern**: Warning flashes twice every minute to ensure visibility
- **Professional Formatting**: Clean, readable presentation

#### Index Marking System

**Activation**: Click the Index tool (🎯) in the toolbar

**Two Display Modes**:

1. **Color Index Mode**:
   - Creates colored border around entire image
   - Border uses your selected index color
   - 5-pixel border width for clear visibility

2. **Number/Letter Mode**:
   - Displays index identifier above image
   - Large, clear numbering system
   - Professional formatting for documentation

#### Support Level Indicator

**Activation**: Click the ID tool (✅) in the toolbar

**What It Shows**:
- Your analytical conclusion in prominent display
- Color-coded for quick visual reference:
  - **Green**: Identification
  - **Red**: Exclusion  
  - **Yellow**: Inconclusive
- Positioned below image for clear association

#### Additional Notes Display

**Activation**: Click the Notes tool (📝) in the toolbar

**What It Shows**:
- Detailed observations from your additional notes
- Professional formatting with proper line breaks
- Right-aligned positioning to balance layout
- Comprehensive text handling for complex analyses

## PDF Generation

### Generating Your Report

1. **Complete Annotations**: Ensure all necessary annotation data is entered
2. **Toggle Desired Elements**: Use toolbar to show only needed annotations  
3. **Click Print Icon** (🖨️): Located in the toolbar
4. **Wait for Generation**: Process typically takes 15-60 seconds
5. **Download Automatically**: PDF downloads with smart filename

### PDF Generation Process

**What Happens Behind the Scenes**:

1. **Data Collection**: System gathers image, annotations, and metadata
2. **HTML Rendering**: Professional layout is generated with your annotations
3. **PDF Conversion**: High-quality PDF is created using advanced rendering
4. **Filename Generation**: Smart naming based on case information
5. **Automatic Download**: File is delivered to your default download location

### PDF Content Structure

**Professional Layout Includes**:

- **Header Section**:
  - Current date (MM/DD/YYYY format)
  - Case number for reference
  - Clean, professional formatting

- **Main Image Area**:
  - Full-resolution image presentation
  - All selected annotations overlaid correctly
  - Index markings as configured
  - Proper scaling and positioning

- **Annotation Information**:
  - Case numbers (if enabled)
  - Class characteristics (if enabled)  
  - Index information (if enabled)
  - Support level conclusion (if enabled)
  - Additional notes (if enabled and populated)

- **Footer Section**:
  - "Notes formatted by Striae©" attribution
  - Last updated timestamp
  - Professional formatting

### Smart Filename Generation

**Automatic Naming Logic**:

1. **Primary Format**: `striae-report-[LeftCase]-[LeftItem]--[RightCase] [RightItem].pdf`
   - Example: `striae-report-2025-001-1A--2025-002 1B.pdf`

2. **Single Case Format**: `striae-report-[Case]-[Item].pdf`
   - Example: `striae-report-2025-001-1A.pdf`

3. **Case Only Format**: `striae-report-[CaseNumber].pdf`
   - Example: `striae-report-2025-001.pdf`

4. **Fallback Format**: `striae-report-[timestamp].pdf`
   - Used when no case information is available

**Filename Sanitization**:
- Removes invalid characters (< > : " / \ | ? *)
- Replaces with hyphens for compatibility
- Ensures proper .pdf extension

## Advanced Features

### Confirmation Field System

**Automatic Activation**:
- Enabled automatically when "Identification" support level is selected
- Can be manually enabled for any support level
- Creates signature area in PDF for technical review

**PDF Output**:
- Professional signature box with lines for:
  - "Confirmation by:" with signature line
  - "Date:" with date line
- Positioned prominently for easy access
- Meets documentation standards for peer review

### Color Index Border System

**Visual Enhancement**:
- Applies selected color as 5-pixel border around image
- Clearly marks indexed comparison points
- Maintains professional appearance
- Visible in both screen view and PDF output

### Subclass Warning System

**Real-time Alerts**:
- Flashing red indicator appears when subclass is marked
- Flash pattern: Two quick flashes every 60 seconds
- Ensures critical information isn't overlooked
- Maintains visibility during extended analysis sessions

### Dynamic Annotation Display

**Flexible Viewing**:
- Toggle any combination of annotation types
- Real-time preview of final PDF appearance
- Hide/show elements based on documentation needs
- Independent control of each annotation layer

## Troubleshooting

### Common Issues and Solutions

#### "PDF generation failed"

**Possible Causes**:
- No image selected
- Network connectivity issues
- Server processing overload

**Solutions**:
1. Ensure an image is loaded and selected
2. Check internet connection stability
3. Wait and try again (server may be busy)
4. Refresh page and reload case if persistent

#### "Cannot generate PDF - no image selected"

**Problem**: Trying to generate PDF without an active image

**Solution**:
1. Load a case with uploaded images
2. Click on an image file to select it
3. Verify image appears in the viewer
4. Try PDF generation again

#### Annotations not appearing correctly

**Problem**: Annotations show differently than expected

**Solutions**:
1. **Save Notes First**: Ensure all annotation data is saved
2. **Check Tool Selection**: Verify correct toolbar buttons are active
3. **Refresh Annotation Data**: Return to case management and reload
4. **Verify Data Entry**: Check that all required fields are completed

#### PDF download not starting

**Problem**: Click print but no download occurs

**Solutions**:
1. **Check Browser Permissions**: Allow downloads from Striae
2. **Disable Pop-up Blockers**: Temporarily disable for PDF generation
3. **Clear Browser Cache**: Remove cached data that might interfere
4. **Try Different Browser**: Test with Chrome, Firefox, or Edge

#### Filename issues

**Problem**: PDF saves with generic or incorrect filename

**Cause**: Missing or incomplete case information

**Solutions**:
1. Complete all case number fields in notes
2. Save notes before generating PDF
3. Verify case information is properly entered
4. Check for special characters in case numbers

### Performance Optimization

#### Large Image Handling

**Best Practices**:
- Compress images to reasonable sizes (under 10MB)
- Use appropriate image formats (PNG for screenshots, JPEG for photos)
- Close other browser tabs during PDF generation
- Ensure stable internet connection

#### Browser Compatibility

**Recommended Browsers**:
- **Chrome**: Best performance and compatibility
- **Firefox**: Good compatibility with modern features
- **Edge**: Full feature support
- **Safari**: Basic functionality (some advanced features may vary)

**Browser Settings**:
- Enable JavaScript
- Allow pop-ups from Striae domain
- Enable automatic downloads
- Clear cache if experiencing issues

## Best Practices

### Annotation Workflow

#### Systematic Approach

1. **Plan Your Documentation**: Decide which annotations are needed before starting
2. **Complete Case Information First**: Enter all case data before annotating
3. **Use Consistent Indexing**: Establish indexing system for multiple comparisons
4. **Save Frequently**: Save notes after each major change
5. **Preview Before PDF**: Use toolbar to preview final appearance

#### Professional Standards

**Case Number Format**:
- Use department standard numbering systems
- Include sufficient detail for identification
- Keep consistent format within case series
- Avoid special characters that may cause filename issues

**Class Characteristic Documentation**:
- Be specific and technically accurate
- Use standard terminology in your field
- Include sufficient detail for peer review
- Note any unusual or significant observations

**Index System Consistency**:
- Use the same indexing method throughout a case
- Choose colors/numbers that reproduce well in print
- Document indexing system in case notes
- Ensure indexes are clearly visible and unambiguous

### Quality Control

#### Pre-PDF Checklist

- [ ] Case numbers are correct and complete
- [ ] Item numbers match evidence documentation
- [ ] Class characteristics are accurately described
- [ ] Support level reflects analytical conclusion
- [ ] Index marks are properly configured
- [ ] Additional notes contain all relevant observations
- [ ] All required annotations are enabled in toolbar
- [ ] Image quality is sufficient for analysis

#### Documentation Standards

**For Identification Conclusions**:
- Enable confirmation field for technical review
- Include detailed class characteristic information
- Document sufficient detail for court presentation
- Ensure all annotations support the conclusion

**For Exclusion Conclusions**:
- Document specific differences observed
- Include class characteristic information
- Note any limiting factors in analysis
- Provide sufficient detail for peer review

**For Inconclusive Results**:
- Document limiting factors
- Note what additional analysis might be helpful
- Include observations that were possible
- Explain factors preventing definitive conclusion

### File Management

#### Organizing PDF Reports

**Naming Conventions**:
- Let Striae auto-generate filenames for consistency
- Create folder structure by case or date
- Include version numbers if multiple reports are generated
- Maintain backup copies of final reports

**Storage Best Practices**:
- Save PDFs to secure, backed-up storage
- Follow department retention policies
- Ensure proper access controls
- Consider cloud storage with encryption

#### Version Control

**Multiple Iterations**:
- Generate new PDF for any significant changes
- Keep dated versions for documentation trail
- Note changes in additional notes section
- Archive previous versions according to policy

---

## Quick Reference

### Essential Workflow

1. **Load Case** → **Select Image** → **Click "Image Notes"**
2. **Enter Case Information** → **Set Class Type** → **Configure Index**
3. **Select Support Level** → **Add Notes** → **Save Notes**
4. **Use Toolbar** to enable desired annotations
5. **Click Print Icon** → **Wait for PDF** → **Download Complete**

### Toolbar Quick Guide

- **🔢 Numbers**: Case/item numbers on image corners
- **📋 Class**: Object type and characteristics below image  
- **🎯 Index**: Color border or number identifier
- **✅ ID**: Support level conclusion display
- **📝 Notes**: Additional observations section
- **🖨️ Print**: Generate professional PDF report

### Common Settings

**Standard Documentation** (Most Cases):
- Numbers: ✅ ON
- Class: ✅ ON  
- Index: ✅ ON
- ID: ✅ ON
- Notes: As needed

**Court Presentation** (Formal Reports):
- All annotations enabled
- Confirmation field enabled
- Professional color scheme
- Complete case information

---

*For technical support or questions about annotation and PDF generation, please contact the Striae support team.*
