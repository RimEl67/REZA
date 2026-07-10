import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _upcoming = [
    {
      'venue': 'Salon Élégance',
      'service': 'Coupe femme',
      'date': 'Lundi 14 Juillet 2026',
      'time': '10:00',
      'duration': '45 min',
      'price': '150 MAD',
      'status': 'confirmed',
      'image': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400',
    },
    {
      'venue': 'Zen Spa',
      'service': 'Massage relaxant',
      'date': 'Mercredi 16 Juillet 2026',
      'time': '15:30',
      'duration': '60 min',
      'price': '250 MAD',
      'status': 'pending',
      'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400',
    },
  ];

  final List<Map<String, dynamic>> _past = [
    {
      'venue': 'Barber Studio',
      'service': 'Coupe homme',
      'date': 'Samedi 5 Juillet 2026',
      'time': '11:00',
      'duration': '30 min',
      'price': '80 MAD',
      'status': 'completed',
      'image': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400',
    },
    {
      'venue': 'Beauty Center Chic',
      'service': 'Manucure gel',
      'date': 'Vendredi 27 Juin 2026',
      'time': '14:00',
      'duration': '60 min',
      'price': '120 MAD',
      'status': 'completed',
      'image': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=400',
    },
    {
      'venue': 'Spa Royal Casablanca',
      'service': 'Hammam traditionnel',
      'date': 'Dimanche 15 Juin 2026',
      'time': '16:00',
      'duration': '60 min',
      'price': '200 MAD',
      'status': 'cancelled',
      'image': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=400',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed': return AppColors.available;
      case 'pending': return const Color(0xFFF59E0B);
      case 'cancelled': return const Color(0xFFEF4444);
      default: return AppColors.textGray;
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'confirmed': return AppColors.availableLight;
      case 'pending': return const Color(0xFFFEF3C7);
      case 'cancelled': return const Color(0xFFFEE2E2);
      default: return AppColors.surface;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 20,
        title: Text(
          'Mes réservations',
          style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textDark),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 2,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textGray,
          labelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400),
          tabs: const [
            Tab(text: 'À venir'),
            Tab(text: 'Passées'),
          ],
        ),
      ),
      body: TabBarView(
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
            Icon(
              isUpcoming ? Icons.calendar_today_rounded : Icons.history_rounded,
              size: 64,
              color: AppColors.textLight,
            ),
            const SizedBox(height: 16),
            Text(
              isUpcoming ? 'Aucune réservation à venir' : 'Aucune réservation passée',
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textGray),
            ),
            const SizedBox(height: 8),
            Text(
              'Trouvez un salon et réservez maintenant !',
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textLight),
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
                          width: 70, height: 70,
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
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  booking['venue'] as String,
                                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _statusBg(status),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  _statusLabel(status),
                                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(status)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(booking['service'] as String, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.textGray),
                              const SizedBox(width: 4),
                              Text(booking['date'] as String, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.access_time_rounded, size: 13, color: AppColors.textGray),
                              const SizedBox(width: 4),
                              Text('${booking['time']} · ${booking['duration']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
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
              if (isUpcoming && status != 'cancelled')
                Container(
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: () {
                            _showCancelDialog(context, booking['venue'] as String);
                          },
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFFEF4444),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Text('Annuler', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      Container(width: 1, height: 40, color: AppColors.border),
                      Expanded(
                        child: TextButton(
                          onPressed: () {},
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Text('Modifier', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  ),
                ),
              if (!isUpcoming && status == 'completed')
                Container(
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: TextButton(
                    onPressed: () {},
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      minimumSize: const Size(double.infinity, 0),
                    ),
                    child: Text('Réserver à nouveau', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _showCancelDialog(BuildContext context, String venueName) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Annuler la réservation', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 18)),
        content: Text(
          'Voulez-vous annuler votre rendez-vous chez $venueName ?',
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Non', style: GoogleFonts.inter(color: AppColors.textGray, fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Oui, annuler', style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
