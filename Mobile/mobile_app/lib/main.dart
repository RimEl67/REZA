import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/pro_onboarding_screen.dart';
import 'constants.dart';

void main() {
  runApp(const RezaApp());
}

class RezaApp extends StatelessWidget {
  const RezaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'REZA',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          surface: AppColors.surface,
        ),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        fontFamily: 'Inter',
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/pro-info': (context) => const ProOnboardingScreen(),
      },
    );
  }
}
