# Contributing to AI Bot ENS Subdomain Registrar

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Check if it's already been suggested
- Explain the use case
- Describe the proposed solution

### Code Contributions

1. **Fork the repo**
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make your changes**
4. **Test thoroughly**: `npx hardhat test`
5. **Commit**: `git commit -m 'Add feature: description'`
6. **Push**: `git push origin feature/your-feature`
7. **Open a Pull Request**

### Code Style

- Use consistent formatting
- Add comments for complex logic
- Follow existing code patterns
- Write tests for new features

### Testing
```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/YourTest.test.js

# Check coverage
npx hardhat coverage
```

### Commit Messages

Use clear, descriptive commit messages:
```
Add: New feature description
Fix: Bug fix description
Update: Change description
Docs: Documentation update
```

## Development Setup
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-bot-registrar.git
cd ai-bot-registrar

# Install dependencies
npm install

# Copy env example
cp .env.example .env

# Run tests
npx hardhat test
```

## Questions?

Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/ai-bot-registrar/discussions) or reach out on Twitter.

Thank you for contributing! 🚀
