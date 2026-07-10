import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Header ──────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 56, 20, 24),
              child: Column(
                children: [
                  // Avatar
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10)],
                        ),
                        child: Center(
                          child: Text(
                            'S',
                            style: GoogleFonts.inter(fontSize: 36, fontWeight: FontWeight.w700, color: Colors.white),
                          ),
                        ),
                      ),
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.edit_rounded, size: 14, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Sara Moukite',
                    style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'sara.moukite@gmail.com',
                    style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray),
                  ),
                  const SizedBox(height: 16),

                  // Stats row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _StatChip(value: '12', label: 'RDV'),
                      Container(width: 1, height: 30, color: AppColors.border, margin: const EdgeInsets.symmetric(horizontal: 20)),
                      _StatChip(value: '3', label: 'Favoris'),
                      Container(width: 1, height: 30, color: AppColors.border, margin: const EdgeInsets.symmetric(horizontal: 20)),
                      _StatChip(value: '4.9', label: 'Note'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ── Settings Sections ────────────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                _SettingsSection(
                  title: 'Mon compte',
                  items: [
                    _SettingsItem(icon: Icons.person_outline_rounded, label: 'Mes informations', onTap: () {}),
                    _SettingsItem(icon: Icons.location_on_outlined, label: 'Mes adresses', onTap: () {}),
                    _SettingsItem(icon: Icons.favorite_border_rounded, label: 'Mes favoris', badge: '3', onTap: () {}),
                    _SettingsItem(icon: Icons.star_border_rounded, label: 'Mes avis', onTap: () {}),
                  ],
                ),
                const SizedBox(height: 12),
                _SettingsSection(
                  title: 'Préférences',
                  items: [
                    _SettingsItem(icon: Icons.notifications_none_rounded, label: 'Notifications', onTap: () {}),
                    _SettingsItem(icon: Icons.language_rounded, label: 'Langue', trailing: 'Français', onTap: () {}),
                    _SettingsItem(icon: Icons.dark_mode_outlined, label: 'Thème', trailing: 'Clair', onTap: () {}),
                  ],
                ),
                const SizedBox(height: 12),
                _SettingsSection(
                  title: 'Support',
                  items: [
                    _SettingsItem(icon: Icons.help_outline_rounded, label: 'Centre d\'aide', onTap: () {}),
                    _SettingsItem(icon: Icons.chat_bubble_outline_rounded, label: 'Nous contacter', onTap: () {}),
                    _SettingsItem(icon: Icons.privacy_tip_outlined, label: 'Politique de confidentialité', onTap: () {}),
                  ],
                ),
                const SizedBox(height: 12),

                // Logout
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: GestureDetector(
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          title: Text('Déconnexion', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 18)),
                          content: Text('Voulez-vous vraiment vous déconnecter ?', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray)),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: Text('Annuler', style: GoogleFonts.inter(color: AppColors.textGray, fontWeight: FontWeight.w600)),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                              },
                              child: Text('Déconnecter', style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFFCA5A5)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 22),
                          const SizedBox(width: 14),
                          Text(
                            'Se déconnecter',
                            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFFEF4444)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),
                Center(
                  child: Text(
                    'REZA v1.0.0 · Fait avec ❤️ au Maroc',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textLight),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String value;
  final String label;

  const _StatChip({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textDark)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
      ],
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<_SettingsItem> items;

  const _SettingsSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
          child: Text(
            title,
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textGray, letterSpacing: 0.8),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final i = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  item,
                  if (i < items.length - 1) const Divider(height: 1, color: AppColors.border, indent: 54),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;
  final String? badge;
  final VoidCallback onTap;

  const _SettingsItem({
    required this.icon,
    required this.label,
    this.trailing,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: AppColors.textDark),
      ),
      title: Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textDark)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(badge!, style: GoogleFonts.inter(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 8),
          ],
          if (trailing != null) ...[
            Text(trailing!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
            const SizedBox(width: 4),
          ],
          const Icon(Icons.chevron_right_rounded, color: AppColors.textLight, size: 20),
        ],
      ),
    );
  }
}
