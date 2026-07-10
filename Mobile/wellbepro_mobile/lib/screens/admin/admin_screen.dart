import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String> _tabs = [
    'Agenda',
    'Prestations',
    'Personnel',
    'Établissement',
    'Statistiques',
  ];

  List<Map<String, dynamic>> _services = [
    {'name': 'Coupe femme', 'duration': '60 min', 'price': '200 DH', 'category': 'Coiffure'},
    {'name': 'Coupe homme', 'duration': '30 min', 'price': '80 DH', 'category': 'Coiffure'},
    {'name': 'Brushing', 'duration': '45 min', 'price': '150 DH', 'category': 'Coiffure'},
    {'name': 'Coloration', 'duration': '90 min', 'price': '400 DH', 'category': 'Couleur'},
    {'name': 'Mèches', 'duration': '120 min', 'price': '500 DH', 'category': 'Couleur'},
    {'name': 'Manucure', 'duration': '45 min', 'price': '90 DH', 'category': 'Esthétique'},
    {'name': 'Soin du visage', 'duration': '60 min', 'price': '180 DH', 'category': 'Esthétique'},
    {'name': 'Massage relaxant', 'duration': '60 min', 'price': '320 DH', 'category': 'Bien-être'},
    {'name': 'Épilation jambes', 'duration': '45 min', 'price': '120 DH', 'category': 'Épilation'},
  ];

  List<Map<String, dynamic>> _staff = [
    {'name': 'Yassine El Fassi', 'role': 'Coiffeur senior', 'color': const Color(0xFF3B82F6)},
    {'name': 'Samira Bouzid', 'role': 'Coiffeuse', 'color': const Color(0xFFEC4899)},
    {'name': 'Khalid Ait Lahcen', 'role': 'Esthéticien', 'color': const Color(0xFF8B5CF6)},
    {'name': 'Nadia El Khatib', 'role': 'Esthéticienne', 'color': const Color(0xFF10B981)},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  void _showAddServiceSheet() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('Nouvelle prestation', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom de la prestation')),
            TextField(controller: priceCtrl, decoration: const InputDecoration(labelText: 'Prix (DH)'), keyboardType: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Annuler', style: GoogleFonts.outfit(color: AppColors.textGray))),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.isNotEmpty && priceCtrl.text.isNotEmpty) {
                setState(() {
                  _services.insert(0, {
                    'name': nameCtrl.text,
                    'duration': '30 min',
                    'price': '${priceCtrl.text} DH',
                    'category': 'Autre',
                  });
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Prestation ajoutée', style: GoogleFonts.outfit()), backgroundColor: AppColors.primary));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: Text('Ajouter', style: GoogleFonts.outfit(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showAddStaffSheet() {
    final nameCtrl = TextEditingController();
    final roleCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('Nouveau collaborateur', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom complet')),
            TextField(controller: roleCtrl, decoration: const InputDecoration(labelText: 'Rôle (ex: Coiffeur)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Annuler', style: GoogleFonts.outfit(color: AppColors.textGray))),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.isNotEmpty && roleCtrl.text.isNotEmpty) {
                setState(() {
                  _staff.insert(0, {
                    'name': nameCtrl.text,
                    'role': roleCtrl.text,
                    'color': AppColors.primary,
                  });
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Collaborateur ajouté', style: GoogleFonts.outfit()), backgroundColor: AppColors.primary));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: Text('Ajouter', style: GoogleFonts.outfit(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: NestedScrollView(
        headerSliverBuilder: (ctx, _) => [
          _buildAppBar(),
          SliverPersistentHeader(
            pinned: true,
            delegate: _StickyTabBarDelegate(
              TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                labelStyle: GoogleFonts.outfit(
                    fontSize: 13, fontWeight: FontWeight.w700),
                unselectedLabelStyle: GoogleFonts.outfit(
                    fontSize: 13, fontWeight: FontWeight.w500),
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textGray,
                indicatorColor: AppColors.primary,
                indicatorWeight: 3,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                tabs: _tabs.map((t) => Tab(text: t)).toList(),
              ),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildAgendaParams(),
            _buildPrestations(),
            _buildPersonnel(),
            _buildEtablissement(),
            _buildStatistiques(),
          ],
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar() {
    return SliverAppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      pinned: false,
      floating: true,
      snap: true,
      expandedHeight: 70,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        title: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Admin',
                    style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark)),
                Text('Paramètres de l\'établissement',
                    style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: AppColors.textGray,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Agenda Params ──────────────────────────────────────────
  Widget _buildAgendaParams() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionCard(
          title: 'Paramètres de l\'agenda',
          icon: Icons.calendar_today_rounded,
          children: [
            _buildToggleSetting('Rappels SMS automatiques', true),
            _buildToggleSetting('Confirmations par email', true),
            _buildToggleSetting('Annulation en ligne', false),
            _buildToggleSetting('Double réservation', false),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard(
          title: 'Horaires d\'ouverture',
          icon: Icons.access_time_rounded,
          children: [
            _buildHoursRow('Lundi - Vendredi', '09:00', '20:00', true),
            _buildHoursRow('Samedi', '09:00', '18:00', true),
            _buildHoursRow('Dimanche', '10:00', '15:00', false),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard(
          title: 'Corbeille des RDV',
          icon: Icons.delete_outline_rounded,
          children: [
            _buildInfoRow('RDV annulés', '3', Icons.cancel_outlined, AppColors.cancelled),
            _buildInfoRow('RDV supprimés', '1', Icons.delete_forever_rounded, AppColors.textGray),
          ],
        ),
      ],
    );
  }

  // ── Prestations ────────────────────────────────────────────
  Widget _buildPrestations() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildActionButton('Ajouter une prestation', Icons.add_circle_outline_rounded, onTap: _showAddServiceSheet),
        const SizedBox(height: 16),
        ..._services.map((s) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.spa_rounded,
                        color: AppColors.primary, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s['name']!,
                          style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark),
                        ),
                        Row(
                          children: [
                            _tag(s['category']!, AppColors.primary),
                            const SizedBox(width: 6),
                            Icon(Icons.timer_outlined,
                                size: 12, color: AppColors.textLight),
                            const SizedBox(width: 3),
                            Text(s['duration']!,
                                style: GoogleFonts.outfit(
                                    fontSize: 11, color: AppColors.textGray)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Text(
                    s['price']!,
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right_rounded,
                      color: AppColors.textGray, size: 18),
                ],
              ),
            )),
      ],
    );
  }

  // ── Personnel ──────────────────────────────────────────────
  Widget _buildPersonnel() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildActionButton('Ajouter un collaborateur', Icons.person_add_rounded, onTap: _showAddStaffSheet),
        const SizedBox(height: 16),
        ..._staff.map((s) {
          final initials = s['name']
              .toString()
              .trim()
              .split(' ')
              .take(2)
              .map((w) => w[0])
              .join()
              .toUpperCase();
          final color = s['color'] as Color;
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      initials,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: color,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s['name'].toString(),
                          style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark)),
                      Text(s['role'].toString(),
                          style: GoogleFonts.outfit(
                              fontSize: 12, color: AppColors.textGray)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.confirmedBg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('Actif',
                      style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.confirmed)),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.more_vert_rounded,
                    color: AppColors.textGray, size: 20),
              ],
            ),
          );
        }),
      ],
    );
  }

  // ── Établissement ──────────────────────────────────────────
  Widget _buildEtablissement() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Profile card — using green gradient to match Agenda accent
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF059669), Color(0xFF10B981)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: Colors.white.withOpacity(0.3), width: 1.5),
                ),
                child: const Icon(Icons.spa_rounded,
                    color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('WellBe Salon',
                      style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white)),
                  Text('Casablanca, Maroc',
                      style: GoogleFonts.outfit(
                          fontSize: 13, color: Colors.white70)),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.edit_rounded,
                    color: Colors.white, size: 18),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildSectionCard(
          title: 'Informations générales',
          icon: Icons.info_outline_rounded,
          children: [
            _buildEditableRow('Nom du salon', 'WellBe Salon'),
            _buildEditableRow('Téléphone', '+212 5 22 34 56 78'),
            _buildEditableRow('Email', 'contact@wellbe.ma'),
            _buildEditableRow('Adresse', '15 Boulevard Anfa, Casablanca'),
            _buildEditableRow('Site web', 'www.wellbe.ma'),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard(
          title: 'Abonnement',
          icon: Icons.workspace_premium_rounded,
          children: [
            _buildInfoRow('Plan', 'Pro', Icons.star_rounded, AppColors.pending),
            _buildInfoRow('Expire le', '31 Déc 2026',
                Icons.calendar_month_rounded, AppColors.primary),
          ],
        ),
      ],
    );
  }

  // ── Statistiques ───────────────────────────────────────────
  Widget _buildStatistiques() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatBox('847', 'RDV ce mois',
                  Icons.calendar_month_rounded, AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatBox('92%', 'Taux occupation',
                  Icons.donut_large_rounded, AppColors.confirmed),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatBox('3.2K', 'Clients total',
                  Icons.people_alt_rounded, const Color(0xFF7C3AED)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatBox('45K DH', 'CA mensuel',
                  Icons.payments_rounded, AppColors.pending),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard(
          title: 'Services les plus populaires',
          icon: Icons.trending_up_rounded,
          children: [
            _buildPopularService('Coupe + Brushing', 120, 1),
            _buildPopularService('Coloration', 95, 2),
            _buildPopularService('Barbe + Coupe', 88, 3),
            _buildPopularService('Manucure', 72, 4),
            _buildPopularService('Soin du visage', 58, 5),
          ],
        ),
        const SizedBox(height: 16),
        _buildSectionCard(
          title: 'Taux d\'annulation',
          icon: Icons.cancel_outlined,
          children: [
            _buildTaxRow('Ce mois', '4.2%', Colors.green),
            _buildTaxRow('Mois précédent', '6.8%', Colors.orange),
            _buildTaxRow('Moyenne annuelle', '5.1%', Colors.blue),
          ],
        ),
      ],
    );
  }

  // ── Reusable Widgets ────────────────────────────────────────

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: AppColors.divider, height: 1),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildToggleSetting(String label, bool value) {
    return StatefulBuilder(
      builder: (ctx, setS) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark)),
            Switch(
              value: value,
              onChanged: (v) => setS(() => value = v),
              activeColor: AppColors.primary,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHoursRow(
      String day, String open, String close, bool isOpen) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(day,
                style: GoogleFonts.outfit(
                    fontSize: 13, color: AppColors.textDark, fontWeight: FontWeight.w600)),
          ),
          if (isOpen) ...[
            Text(open,
                style: GoogleFonts.outfit(
                    fontSize: 12, color: AppColors.textGray, fontWeight: FontWeight.w600)),
            const Text(' – ', style: TextStyle(color: AppColors.textLight)),
            Text(close,
                style: GoogleFonts.outfit(
                    fontSize: 12, color: AppColors.textGray, fontWeight: FontWeight.w600)),
          ] else
            Text('Fermé',
                style: GoogleFonts.outfit(
                    fontSize: 12, color: AppColors.cancelled, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(
      String label, String value, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 10),
          Text(label,
              style: GoogleFonts.outfit(
                  fontSize: 13, color: AppColors.textGray)),
          const Spacer(),
          Text(value,
              style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: color)),
        ],
      ),
    );
  }

  Widget _buildEditableRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(label,
                style: GoogleFonts.outfit(
                    fontSize: 12, color: AppColors.textGray)),
          ),
          Expanded(
            flex: 3,
            child: Text(value,
                style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark)),
          ),
          const Icon(Icons.edit_outlined,
              size: 16, color: AppColors.textLight),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(
              color: AppColors.primary.withOpacity(0.4), width: 1.5),
          borderRadius: BorderRadius.circular(14),
          color: AppColors.primary.withOpacity(0.04),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            Text(label,
                style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary)),
          ],
        ),
      ),
    );
  }

  Widget _tag(String text, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 6, top: 3),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text,
          style: GoogleFonts.outfit(
              fontSize: 10, fontWeight: FontWeight.w700, color: color)),
    );
  }

  Widget _buildStatBox(
      String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 10),
          Text(value,
              style: GoogleFonts.outfit(
                  fontSize: 26, fontWeight: FontWeight.w800, color: color)),
          Text(label,
              style: GoogleFonts.outfit(
                  fontSize: 12, fontWeight: FontWeight.w600, color: color.withOpacity(0.7))),
        ],
      ),
    );
  }

  Widget _buildPopularService(String name, int count, int rank) {
    final pct = count / 120;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: rank <= 3
                  ? AppColors.primary.withOpacity(0.1)
                  : AppColors.surfaceGray,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text('$rank',
                  style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: rank <= 3
                          ? AppColors.primary
                          : AppColors.textGray)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(name,
                        style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textDark)),
                    Text('$count RDV',
                        style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary)),
                  ],
                ),
                const SizedBox(height: 5),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: pct,
                    backgroundColor: AppColors.primary.withOpacity(0.08),
                    valueColor:
                        const AlwaysStoppedAnimation(AppColors.primary),
                    minHeight: 5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaxRow(String period, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
              child: Text(period,
                  style: GoogleFonts.outfit(
                      fontSize: 13, color: AppColors.textGray))),
          Text(value,
              style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: color)),
        ],
      ),
    );
  }
}

class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _StickyTabBarDelegate(this.tabBar);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: tabBar,
    );
  }

  @override
  double get maxExtent => 48;
  @override
  double get minExtent => 48;
  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate old) => false;
}
