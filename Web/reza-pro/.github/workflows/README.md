# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI (`ci.yml`)
- **Triggers:** Push and pull requests to `main` and `develop` branches
- **Purpose:** Build and test the application
- **Actions:**
  - Installs dependencies
  - Runs linter
  - Builds the Next.js application
  - Verifies build artifacts

### 2. CD (`cd.yml`)
- **Triggers:** Push to `main` branch or manual dispatch
- **Purpose:** Build Docker image and deploy to server
- **Actions:**
  - Builds Docker image
  - Deploys to server via SSH (if configured)
- **Required Secrets:**
  - `DEPLOY_HOST`: Server hostname/IP
  - `DEPLOY_USER`: SSH username
  - `DEPLOY_SSH_KEY`: Private SSH key
  - `NEXT_PUBLIC_API_URL`: API URL (optional)
  - `REACT_APP_API_URL`: API URL (optional)

### 3. Docker Build and Push (`docker-build.yml`)
- **Triggers:** Push to `main`, version tags, or manual dispatch
- **Purpose:** Build and push Docker image to GitHub Container Registry
- **Actions:**
  - Builds Docker image with metadata
  - Pushes to `ghcr.io`
  - Supports semantic versioning tags

## Required GitHub Secrets

Configure these in your repository settings (Settings → Secrets and variables → Actions):

### For CI/CD:
- `NEXT_PUBLIC_API_URL` (optional): API endpoint URL
- `REACT_APP_API_URL` (optional): API endpoint URL

### For Deployment:
- `DEPLOY_HOST`: Your server hostname or IP
- `DEPLOY_USER`: SSH username for deployment
- `DEPLOY_SSH_KEY`: Private SSH key for server access

### For Docker Registry:
- `GITHUB_TOKEN`: Automatically provided by GitHub
- `DOCKER_USERNAME` (optional): For Docker Hub
- `DOCKER_PASSWORD` (optional): For Docker Hub

## Usage

1. **Automatic CI:** Runs on every push/PR
2. **Manual Deployment:** Go to Actions → CD → Run workflow
3. **Docker Build:** Automatically builds on push to main or when creating version tags
