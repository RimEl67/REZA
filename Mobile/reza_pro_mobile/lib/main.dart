import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'constants/app_colors.dart';

import 'package:intl/date_symbol_data_local.dart';

void main() {
  initializeDateFormatting('fr_FR', null).then((_) {
    runApp(const WellBeProApp());
  });
}

class WellBeProApp extends StatelessWidget {
  const WellBeProApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WellBePro',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: Colors.white,
        // Outfit font globally — matching the Agenda page reference style
        textTheme: GoogleFonts.outfitTextTheme(),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textDark,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
      },
    );
  }
}
