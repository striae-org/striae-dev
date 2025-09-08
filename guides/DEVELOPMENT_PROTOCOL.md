# Striae Development Protocol Guide

## Table of Contents

1. [Overview](#overview)
2. [Repository Structure](#repository-structure)
3. [Development Workflow](#development-workflow)
   - [Fork Management](#fork-management)
   - [Branch Strategy](#branch-strategy)
   - [Commit Guidelines](#commit-guidelines)
4. [Pull Request Process](#pull-request-process)
   - [PR Requirements](#pr-requirements)
   - [Review Process](#review-process)
   - [Merge Guidelines](#merge-guidelines)
5. [Code Quality Standards](#code-quality-standards)
   - [Code Style](#code-style)
   - [Testing Requirements](#testing-requirements)
   - [Documentation](#documentation)
6. [Security Considerations](#security-considerations)
7. [Release Management](#release-management)
8. [Issue Management](#issue-management)
9. [Communication Guidelines](#communication-guidelines)

## Overview

This guide establishes the development protocols and best practices for contributing to the Striae project. Following these guidelines ensures code quality, security, and maintainability while facilitating effective collaboration among contributors.

## Repository Structure

The Striae project uses a fork-based development model with the following repositories:

- **Production Repository**: `striae-org/striae` (`master` branch)
- **Development Fork**: `striae-org/striae-dev` (`master` branch)
- **Contributor Forks**: Individual forks from `striae-org/striae-dev`

## Development Workflow

### Fork Management

1. **Development Work**: All development must be performed on the `striae-org/striae-dev` fork
2. **Fork Synchronization**: Keep your fork synchronized with the upstream `striae-org/striae-dev` repository
3. **No Direct Development**: Never develop directly on the production repository `striae-org/striae`

```bash
# Add upstream remote (one-time setup)
git remote add upstream https://github.com/striae-org/striae-dev.git

# Sync your fork regularly
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Branch Strategy

1. **Feature Branches**: Create descriptive feature branches from the latest `main` branch
2. **Branch Naming**: Use descriptive names following the pattern:
   - `feature/feature-name`
   - `bugfix/issue-description`
   - `hotfix/critical-fix`
   - `docs/documentation-update`

```bash
# Example branch creation
git checkout main
git pull upstream main
git checkout -b feature/user-authentication-improvements
```

### Commit Guidelines

1. **Commit Frequency**: Commit often with logical, atomic changes
2. **File Limit**: Avoid modifying more than 5 files per commit when possible
3. **Commit Messages**: Use clear, descriptive commit messages following conventional commit format:

```text
type(scope): brief description

Detailed explanation of what changed and why
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```text
feat(auth): implement multi-factor authentication support

Add MFA functionality with TOTP support and backup codes.
Includes user settings UI and Firebase integration.

fix(canvas): resolve annotation positioning on mobile devices

Fixes issue where touch events were incorrectly calculated
on devices with different pixel densities.
```

## Pull Request Process

### PR Requirements

1. **Target Repository**: All pull requests must be submitted to `striae-org/striae-dev` ONLY
2. **Branch Protection**: Ensure your branch is up-to-date with the target branch
3. **PR Template**: Use the provided PR template and fill out all sections

### Review Process

1. **Mandatory Review**: All pull requests must be reviewed and approved by a project admin before merging
2. **Review Criteria**: Reviews will assess:
   - Code quality and adherence to standards
   - Security implications
   - Performance impact
   - Test coverage
   - Documentation completeness

### Merge Guidelines

1. **Admin Only**: Only project administrators can merge pull requests
2. **Merge Strategy**: Use "Squash and Merge" for feature branches to maintain clean history
3. **Delete Branches**: Feature branches should be deleted after successful merge

### PR Description Requirements

**Required Information:**

- **Summary**: Clear description of what the PR accomplishes
- **Changes Made**: Detailed list of modifications
- **Testing**: Description of testing performed
- **Breaking Changes**: Any breaking changes and migration notes
- **Related Issues**: Link to related issues or discussions
- **Screenshots**: For UI changes, include before/after screenshots
- **Security Impact**: Any security considerations or changes

**PR Description Template:**

```markdown
## Summary
Brief description of the changes and their purpose.

## Changes Made
- [ ] Feature 1: Description
- [ ] Feature 2: Description
- [ ] Bug fix: Description

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests verified
- [ ] Manual testing completed
- [ ] Browser compatibility verified

## Breaking Changes
List any breaking changes and migration steps.

## Security Impact
Describe any security considerations or changes.

## Related Issues
Closes #123
Related to #456

## Screenshots (if applicable)
[Include relevant screenshots]
```

## Code Quality Standards

### Code Style

1. **Formatting**: Use Prettier for consistent code formatting
2. **Linting**: Follow ESLint rules defined in the project
3. **TypeScript**: Maintain strict TypeScript compliance
4. **Comments**: Write clear, meaningful comments for complex logic

### Testing Requirements

1. **Unit Tests**: Write unit tests for new functionality
2. **Integration Tests**: Include integration tests for API endpoints
3. **Coverage**: Maintain or improve code coverage
4. **Test Naming**: Use descriptive test names and organize tests logically

### Documentation

1. **Code Documentation**: Document complex functions and classes
2. **README Updates**: Update relevant README files for new features
3. **API Documentation**: Update API documentation for endpoint changes
4. **Guide Updates**: Update relevant guides in the `/guides` directory

## Security Considerations

1. **Sensitive Data**: Never commit sensitive data (API keys, passwords, etc.)
2. **Dependencies**: Keep dependencies updated and scan for vulnerabilities
3. **Input Validation**: Validate all user inputs
4. **Authentication**: Follow established authentication patterns
5. **Environment Variables**: Use environment variables for configuration

## Release Management

1. **Versioning Scheme**: Follow the project's versioning format:
   - **Beta Releases**: `v0.#.#-beta` (e.g., `v0.9.06-beta`)
     - First number: Always `0` for beta releases
     - Second number: Month (1-12)
     - Third number: Date (01-31)
   - **Production Releases**: `v#.##.##` (e.g., `v1.01.00`)
     - First number: Major release (breaking changes, major features)
     - Second number: Minor release (new features, enhancements)
     - Third number: Patch release (bug fixes, small improvements)
2. **Release Notes**: Maintain comprehensive release notes for each version
3. **Changelog**: Update `README.md` changelog for each release
4. **Tag Management**: Use proper Git tags matching the version format (`v0.#.#-beta` or `v#.##.##`)
5. **Beta to Production**: Beta versions should be thoroughly tested before removing the `-beta` suffix and promoting version numbers to production releases
6. **Release Immutability**: Once a release is tagged and published, it is immutable and cannot be modified. If issues are discovered, create a new release with an incremented version number

## Issue Management

1. **Issue Templates**: Use provided issue templates
2. **Labels**: Apply appropriate labels to issues
3. **Assignees**: Assign issues to appropriate team members
4. **Milestones**: Associate issues with relevant milestones
5. **Documentation**: Link related documentation and PRs

## Communication Guidelines

1. **Respectful Communication**: Maintain professional and respectful communication
2. **Clear Communication**: Be clear and specific in issue descriptions and comments
3. **Response Time**: Respond to reviews and comments in a timely manner
4. **Code of Conduct**: Follow the project's Code of Conduct at all times

## Additional Best Practices

### Performance Considerations

- Profile performance impact of changes
- Optimize database queries and API calls
- Consider caching strategies for improved performance

### Accessibility

- Ensure UI changes meet accessibility standards
- Test with screen readers and keyboard navigation
- Include proper ARIA labels and semantic HTML

### Mobile Compatibility

- Test changes on mobile devices
- Ensure responsive design principles are followed
- Verify touch interactions work correctly

### Error Handling

- Implement comprehensive error handling
- Provide meaningful error messages to users
- Log errors appropriately for debugging

### Monitoring and Observability

- Include appropriate logging for new features
- Consider monitoring and alerting needs
- Document operational procedures for new services

## Enforcement

Failure to follow these protocols may result in:

- PR rejection and request for revision
- Additional review requirements
- Temporary restriction from contributing

## Questions and Support

For questions about these protocols or development practices:

- Open an issue with the `question` label
- Contact project administrators
- Refer to the project documentation

---

*This guide is a living document and will be updated as the project evolves. Contributors are encouraged to suggest improvements to these protocols.*
