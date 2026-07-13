# GitHub Push Setup Instructions

## Current Status
✅ All changes have been committed locally:
- Removed unused UI components
- Added GitHub Actions CI/CD workflows

## To Push to GitHub

You need to authenticate with GitHub. Choose one of the following methods:

### Option 1: Personal Access Token (Recommended)

1. Create a Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Copy the token

2. Push using the token:
   ```bash
   cd /root/reza/saas
   git push https://YOUR_TOKEN@github.com/OUZalpha/reza-client.git main
   ```

   Or set it up permanently:
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/OUZalpha/reza-client.git
   git push origin main
   ```

### Option 2: SSH Key

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add SSH key to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the key and save

3. Update remote and push:
   ```bash
   cd /root/reza/saas
   git remote set-url origin git@github.com:OUZalpha/reza-client.git
   git push origin main
   ```

### Option 3: GitHub CLI

```bash
gh auth login
cd /root/reza/saas
git push origin main
```

## After Pushing

Once pushed, the GitHub Actions workflows will automatically:
- Run CI on every push/PR
- Build Docker images on push to main
- Deploy (if secrets are configured)

## Required GitHub Secrets

Configure these in your repository (Settings → Secrets and variables → Actions):

### For Deployment:
- `DEPLOY_HOST`: Your server hostname/IP
- `DEPLOY_USER`: SSH username
- `DEPLOY_SSH_KEY`: Private SSH key for server access

### Optional:
- `NEXT_PUBLIC_API_URL`: API endpoint (defaults to https://api.reza.ma/api)
- `REACT_APP_API_URL`: API endpoint (defaults to https://api.reza.ma)
