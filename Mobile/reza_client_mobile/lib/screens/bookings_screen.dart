import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../constants.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../services/api_client.dart';
import '../viewmodels/bookings_viewmodel.dart';
import 'login_screen.dart';

class BookingsScreen extends StatelessWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BookingsViewModel(),
      child: const _BookingsBody(),
    );
  }
}

class _BookingsBody extends StatefulWidget {
  const _BookingsBody();
  @override
  State<_BookingsBody> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<_BookingsBody> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  BookingsViewModel get _bvm => context.watch<BookingsViewModel>();
  List<Map<String, dynamic>> get _upcoming => _bvm.upcoming;
  List<Map<String, dynamic>> get _past => _bvm.past;
  bool get _loading => _bvm.loading;
  String? get _error => _bvm.error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = context.read<AuthViewModel>();
    await context.read<BookingsViewModel>().load(auth.email);
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed':
        return AppColors.available;
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'cancelled':
        return const Color(0xFFEF4444);
      default:
        return AppColors.textGray;
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'confirmed':
        return AppColors.availableLight;
      case 'pending':
        return const Color(0xFFFEF3C7);
      case 'cancelled':
        return const Color(0xFFFEE2E2);
      default:
        return AppColors.surface;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  }

  bool _canCancel(String status) {
    final s = status.toLowerCase();
    return s == 'pending' || s == 'confirmed';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.calendar_today_rounded, size: 64, color: AppColors.textLight),
                const SizedBox(height: 16),
                Text('Connectez-vous pour voir vos RDV', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textGray), textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    await Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                    _load();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                  child: Text('Se connecter', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 20,
        title: Text('Mes réservations', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textDark)),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, color: AppColors.textDark)),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 2,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textGray,
          labelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400),
          tabs: const [Tab(text: 'À venir'), Tab(text: 'Passées')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(child: Text(_error!, style: GoogleFonts.inter(color: AppColors.textGray)))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildList(_upcoming, isUpcoming: true),
                    _buildList(_past, isUpcoming: false),
                  ],
                ),
    );
  }

  Widget _buildList(List<Map<String, dynamic>> bookings, {required bool isUpcoming}) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isUpcoming ? Icons.calendar_today_rounded : Icons.history_rounded, size: 64, color: AppColors.textLight),
            const SizedBox(height: 16),
            Text(
              isUpcoming ? 'Aucune réservation à venir' : 'Aucune réservation passée',
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textGray),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final booking = bookings[index];
        final status = booking['status'] as String;
        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: const [BoxShadow(color: AppColors.cardShadow, blurRadius: 8, offset: Offset(0, 2))],
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        booking['image'] as String,
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 70,
                          height: 70,
                          color: AppColors.surface,
                          child: const Icon(Icons.image_rounded, color: AppColors.textLight),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(booking['venue'] as String,
                                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                decoration: BoxDecoration(color: _statusBg(status), borderRadius: BorderRadius.circular(20)),
                                child: Text(_statusLabel(status),
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(status))),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(booking['service'] as String, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray)),
                          if (status == 'pending') ...[
                            const SizedBox(height: 4),
                            Text(
                              'En attente du salon',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFFB45309)),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Text('${booking['date']} · ${booking['time']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text('${booking['duration']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
                              const Spacer(),
                              Text(booking['price'] as String, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (isUpcoming && _canCancel(status))
                Container(
                  decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
                  child: TextButton(
                    onPressed: () => _showCancelDialog(booking),
                    style: TextButton.styleFrom(foregroundColor: const Color(0xFFEF4444), padding: const EdgeInsets.symmetric(vertical: 12)),
                    child: Text('Annuler', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _showCancelDialog(Map<String, dynamic> booking) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Annuler la réservation', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 18)),
        content: Text(
          'Voulez-vous annuler votre rendez-vous chez ${booking['venue']} ?',
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Non', style: GoogleFonts.inter(color: AppColors.textGray, fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final email = context.read<AuthViewModel>().email;
              final id = booking['id'] as String?;
              if (email == null || id == null || id.isEmpty) return;
              try {
                await context.read<BookingsViewModel>().cancel(id, email);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Réservation annulée')),
                  );
                  _load();
                }
              } on ApiException catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                }
              }
            },
            child: Text('Oui, annuler', style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
