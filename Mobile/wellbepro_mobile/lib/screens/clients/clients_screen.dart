import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../models/client.dart';
import '../../widgets/client_card.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _sortBy = 'Nom';
  late List<Client> _clients;

  final List<String> _sortOptions = ['Nom', 'Dernière visite', 'Total dépensé', 'Visites'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _clients = generateMockClients();
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<Client> get _filteredClients {
    var list = _clients.where((c) {
      final q = _searchQuery.toLowerCase();
      return c.name.toLowerCase().contains(q) ||
          c.email.toLowerCase().contains(q) ||
          c.phone.contains(q);
    }).toList();

    switch (_sortBy) {
      case 'Dernière visite':
        list.sort((a, b) => (b.lastVisit ?? DateTime(0))
            .compareTo(a.lastVisit ?? DateTime(0)));
        break;
      case 'Total dépensé':
        list.sort((a, b) => b.totalSpent.compareTo(a.totalSpent));
        break;
      case 'Visites':
        list.sort((a, b) => b.totalVisits.compareTo(a.totalVisits));
        break;
      default:
        list.sort((a, b) => a.name.compareTo(b.name));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerScrolled) => [
          _buildAppBar(),
          SliverToBoxAdapter(child: _buildSearchAndSort()),
          SliverToBoxAdapter(child: _buildSummaryCards()),
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabBarDelegate(
              TabBar(
                controller: _tabController,
                labelStyle: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
                unselectedLabelStyle: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textGray,
                indicatorColor: AppColors.primary,
                indicatorWeight: 3,
                tabs: const [
                  Tab(text: 'Tous les clients'),
                  Tab(text: 'Fichier client'),
                ],
              ),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildClientList(),
            _buildClientFiche(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddClientSheet,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: const Icon(Icons.person_add_rounded, size: 20),
        label: Text(
          'Nouveau client',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13),
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
                Text(
                  'Clients',
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  '${_clients.length} clients enregistrés',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    color: AppColors.textGray,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const Spacer(),
            IconButton(
              icon: const Icon(Icons.tune_rounded, color: AppColors.textGray),
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchAndSort() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: TextField(
                controller: _searchController,
                style: GoogleFonts.outfit(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Rechercher un client...',
                  hintStyle: GoogleFonts.outfit(
                    fontSize: 13,
                    color: AppColors.textLight,
                  ),
                  prefixIcon: const Icon(Icons.search_rounded,
                      color: AppColors.textGray, size: 20),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 13),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _sortBy,
                icon: const Icon(Icons.swap_vert_rounded,
                    size: 18, color: AppColors.textGray),
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textDark,
                ),
                items: _sortOptions
                    .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                    .toList(),
                onChanged: (v) => setState(() => _sortBy = v!),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards() {
    final totalRevenue = _clients.fold(0.0, (sum, c) => sum + c.totalSpent);
    final totalVisits = _clients.fold(0, (sum, c) => sum + c.totalVisits);
    final activeClients = _clients.where((c) =>
        c.lastVisit != null &&
        DateTime.now().difference(c.lastVisit!).inDays <= 30).length;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          _buildSummaryCard('${_clients.length}', 'Total clients',
              Icons.people_alt_rounded, AppColors.primary, AppColors.primary.withOpacity(0.1)),
          const SizedBox(width: 10),
          _buildSummaryCard('$activeClients', 'Actifs (30j)',
              Icons.trending_up_rounded, AppColors.confirmed, AppColors.confirmedBg),
          const SizedBox(width: 10),
          _buildSummaryCard('$totalVisits', 'Visites totales',
              Icons.calendar_month_rounded, AppColors.pending, AppColors.pendingBg),
          const SizedBox(width: 10),
          _buildSummaryCard(
              '${totalRevenue.toStringAsFixed(0)} DH',
              'Chiffre d\'affaires',
              Icons.payments_rounded,
              const Color(0xFF7C3AED),
              const Color(0xFFF3E8FF)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
      String value, String label, IconData icon, Color color, Color bg) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 10),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientList() {
    final clients = _filteredClients;
    if (clients.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person_search_rounded, size: 48, color: AppColors.textLight),
            const SizedBox(height: 12),
            Text(
              'Aucun client trouvé',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textGray,
              ),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
      itemCount: clients.length,
      itemBuilder: (ctx, i) => ClientCard(client: clients[i]),
    );
  }

  Widget _buildClientFiche() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Fiche client rapide',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Sélectionnez un client dans la liste "Tous les clients" pour accéder à sa fiche complète.',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: AppColors.textGray,
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ..._filteredClients.take(5).map((c) => ClientCard(client: c)),
      ],
    );
  }

  void _showAddClientSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddClientSheet(
        onAdd: (client) => setState(() => _clients.add(client)),
        nextId: _clients.length + 1,
      ),
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabBarDelegate(this.tabBar);

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
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}

class _AddClientSheet extends StatefulWidget {
  final Function(Client) onAdd;
  final int nextId;
  const _AddClientSheet({required this.onAdd, required this.nextId});

  @override
  State<_AddClientSheet> createState() => _AddClientSheetState();
}

class _AddClientSheetState extends State<_AddClientSheet> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_nameController.text.isEmpty || _phoneController.text.isEmpty) return;
    final client = Client(
      id: widget.nextId,
      name: _nameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
      address: _addressController.text.isNotEmpty ? _addressController.text : null,
    );
    widget.onAdd(client);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Nouveau client',
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 20),
          _field(_nameController, 'Nom complet *', 'Yasmine Benali'),
          const SizedBox(height: 12),
          _field(_phoneController, 'Téléphone *', '+212 6 61 23 45 67',
              type: TextInputType.phone),
          const SizedBox(height: 12),
          _field(_emailController, 'Email', 'client@exemple.com',
              type: TextInputType.emailAddress),
          const SizedBox(height: 12),
          _field(_addressController, 'Adresse', 'Casablanca'),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              child: Text(
                'Ajouter le client',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label, String hint,
      {TextInputType type = TextInputType.text}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.outfit(
                fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textDark)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: type,
          style: GoogleFonts.outfit(fontSize: 14, color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.outfit(fontSize: 13, color: AppColors.textLight),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            filled: true,
            fillColor: AppColors.surfaceGray,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }
}
