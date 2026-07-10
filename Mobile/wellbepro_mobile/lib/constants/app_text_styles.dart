import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTextStyles {
  // All text uses Outfit font — matching the Agenda page style

  static TextStyle get displayLarge => GoogleFonts.outfit(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        color: AppColors.textDark,
        letterSpacing: -0.5,
      );

  static TextStyle get displayMedium => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: AppColors.textDark,
        letterSpacing: -0.3,
      );

  static TextStyle get titleLarge => GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: AppColors.textDark,
      );

  static TextStyle get titleMedium => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
      );

  static TextStyle get titleSmall => GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
      );

  static TextStyle get bodyLarge => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: AppColors.textDark,
      );

  static TextStyle get bodyMedium => GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: AppColors.textGray,
      );

  static TextStyle get bodySmall => GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: AppColors.textGray,
      );

  static TextStyle get labelLarge => GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      );

  static TextStyle get caption => GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: AppColors.textLight,
        letterSpacing: 0.3,
      );
}
