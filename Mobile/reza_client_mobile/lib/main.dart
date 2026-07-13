import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/pro_onboarding_screen.dart';
import 'constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final auth = AuthProvider();
  await auth.bootstrap();
  runApp(RezaApp(auth: auth));
}

class RezaApp extends StatelessWidget {
  const RezaApp({super.key, required this.auth});
  final AuthProvider auth;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: auth,
      child: MaterialApp(
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
      ),
    );
  }
}
