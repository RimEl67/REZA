# mobile_app

REZA client Flutter app.

## Dev API base (emulator / physical)

Prefer the helper (auto `API_BASE`):

```powershell
cd Mobile/reza_client_mobile
.\scripts\run_dev.ps1
.\scripts\run_dev.ps1 -UseAdbReverse   # USB phone → 127.0.0.1
```

- Emulator → `http://10.0.2.2:5000/api`
- Physical → `http://<PC-LAN-IP>:5000/api`

Android Studio does not run this script. Set Additional run args:
`--dart-define=API_BASE=http://<LAN_IP>:5000/api`

Login (after seed): `client1@gmail.com` / `123456`

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
