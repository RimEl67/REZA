import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../viewmodels/auth_viewmodel.dart';

/// Multi-select salon filter chip + bottom sheet (Web [SalonFilterControl] parity).
/// Hidden when account has ≤1 salon.
class SalonFilterControl extends StatelessWidget {
  const SalonFilterControl({
    super.key,
    this.compact = false,
    this.showHint = true,
  });

  final bool compact;
  final bool showHint;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    if (!auth.hasMultipleSalons) {
      return Text(
        auth.activeSalonName,
        style: GoogleFonts.outfit(
          color: AppColors.textGray,
          fontSize: compact ? 11 : 13,
          fontWeight: FontWeight.w500,
        ),
        overflow: TextOverflow.ellipsis,
      );
    }

    final multi = auth.isSalonFilterMulti;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => openSalonFilterSheet(context, showHint: showHint),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 10 : 12,
            vertical: compact ? 5 : 7,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: multi
                  ? AppColors.navy.withValues(alpha: 0.4)
                  : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.storefront_outlined,
                size: compact ? 14 : 16,
                color: AppColors.navy,
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  auth.salonFilterLabel,
                  style: GoogleFonts.outfit(
                    fontSize: compact ? 12 : 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 2),
              Icon(
                Icons.keyboard_arrow_down_rounded,
                size: compact ? 16 : 18,
                color: AppColors.textLight,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> openSalonFilterSheet(
  BuildContext context, {
  bool showHint = true,
}) async {
  final auth = context.read<AuthViewModel>();
  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            SalonFilterPanel(auth: auth, showHint: showHint),
          ],
        ),
      ),
    ),
  );
}

/// Inline multi-checkbox salon filter (sheet + drawer).
class SalonFilterPanel extends StatefulWidget {
  const SalonFilterPanel({
    super.key,
    required this.auth,
    this.showHint = true,
    this.title = 'Filtrer les salons',
  });

  final AuthViewModel auth;
  final bool showHint;
  final String title;

  @override
  State<SalonFilterPanel> createState() => _SalonFilterPanelState();
}

class _SalonFilterPanelState extends State<SalonFilterPanel> {
  late bool _allSelected;
  late Set<String> _selected;

  AuthViewModel get auth => widget.auth;

  @override
  void initState() {
    super.initState();
    _syncFromAuth();
  }

  void _syncFromAuth() {
    _allSelected = auth.isSalonFilterAll ||
        auth.effectiveSalonIds.length == auth.salons.length;
    _selected = Set<String>.from(auth.effectiveSalonIds);
  }

  Future<void> _selectAll() async {
    await auth.setSalonFilterAll();
    if (!mounted) return;
    setState(_syncFromAuth);
  }

  Future<void> _toggleSalon(String id) async {
    if (_allSelected) {
      final next =
          auth.salons.map((s) => s.id).where((sid) => sid != id).toList();
      await auth.setSalonFilterIds(next.isEmpty ? [id] : next);
    } else {
      final next = Set<String>.from(_selected);
      if (next.contains(id)) {
        next.remove(id);
        if (next.isEmpty) {
          await auth.setSalonFilterIds([id]);
        } else {
          await auth.setSalonFilterIds(next.toList());
        }
      } else {
        next.add(id);
        await auth.setSalonFilterIds(next.toList());
      }
    }
    if (!mounted) return;
    setState(_syncFromAuth);
  }

  @override
  Widget build(BuildContext context) {
    final salons = auth.salons;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Text(
            widget.title,
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: AppColors.textLight,
            ),
          ),
        ),
        ListTile(
          dense: true,
          onTap: _selectAll,
          leading: _CheckDot(checked: _allSelected),
          title: Text(
            'Tous les salons',
            style: GoogleFonts.outfit(
              fontWeight: _allSelected ? FontWeight.w700 : FontWeight.w500,
              color: _allSelected ? AppColors.navy : AppColors.textDark,
            ),
          ),
          trailing: _allSelected
              ? const Icon(Icons.check, size: 18, color: AppColors.navy)
              : null,
        ),
        const Divider(height: 8),
        ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.4,
          ),
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: salons.length,
            itemBuilder: (context, i) {
              final salon = salons[i];
              final checked = _allSelected || _selected.contains(salon.id);
              return ListTile(
                dense: true,
                onTap: () => _toggleSalon(salon.id),
                leading: _CheckDot(checked: checked),
                title: Text(
                  salon.name,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: salon.city != null && salon.city!.isNotEmpty
                    ? Text(
                        salon.city!,
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          color: AppColors.textLight,
                        ),
                      )
                    : null,
              );
            },
          ),
        ),
        if (widget.showHint)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: Text(
              'Filtre Agenda, Clients et Caisse. Création → un salon précis requis si plusieurs sélectionnés.',
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: AppColors.textLight,
                height: 1.35,
              ),
            ),
          ),
      ],
    );
  }
}

class _CheckDot extends StatelessWidget {
  const _CheckDot({required this.checked});
  final bool checked;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: checked ? Colors.black : Colors.transparent,
        border: checked ? null : Border.all(color: AppColors.border),
      ),
      child: checked
          ? const Icon(Icons.check, size: 11, color: Colors.white)
          : null,
    );
  }
}
