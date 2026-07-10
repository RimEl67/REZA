import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants.dart';
import 'booking_confirmation_screen.dart';

class BookingScreen extends StatefulWidget {
  final VenueItem venue;
  final ServiceItem? preselectedService;

  const BookingScreen({super.key, required this.venue, this.preselectedService});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _step = 0; // 0 = option, 1 = services, 2 = date/time, 3 = login
  // ignore: unused_field
  bool _isGroupBooking = false;
  final List<ServiceItem> _selectedServices = [];
  DateTime? _selectedDate;
  String? _selectedTime;

  final TextEditingController _emailController = TextEditingController();

  final List<String> _timeSlots = [
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30',
    '16:00', '16:30',
    '17:00', '17:30',
    '18:00',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.preselectedService != null) {
      _selectedServices.add(widget.preselectedService!);
      _step = 1; // Skip to services (already pre-selected one)
    }
    _selectedDate = DateTime.now();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  List<DateTime> get _nextDays {
    return List.generate(14, (i) => DateTime.now().add(Duration(days: i)));
  }

  String _dayAbbr(DateTime d) {
    const days = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
    return days[d.weekday - 1];
  }

  String _monthAbbr(DateTime d) {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[d.month - 1];
  }

  String _formatFullDate(DateTime d) {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return '${days[d.weekday - 1]} ${d.day} ${months[d.month - 1]}';
  }

  double get _totalPrice =>
      _selectedServices.fold(0, (sum, s) => sum + s.price);

  int get _totalDuration =>
      _selectedServices.fold(0, (sum, s) => sum + s.durationMin);

  String get _durationLabel {
    final h = _totalDuration ~/ 60;
    final m = _totalDuration % 60;
    if (h > 0 && m > 0) return '$h h $m min';
    if (h > 0) return '$h h';
    return '$m min';
  }

  void _goBack() {
    if (_step > 0) {
      setState(() => _step--);
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ───────────────────────────────────────────
            _buildHeader(),

            // ── Content ──────────────────────────────────────────
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, anim) =>
                    FadeTransition(opacity: anim, child: child),
                child: _step == 0
                    ? _buildOptionStep()
                    : _step == 1
                        ? _buildServicesStep()
                        : _step == 2
                            ? _buildDateTimeStep()
                            : _buildLoginStep(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textDark, size: 22),
            onPressed: _goBack,
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.textDark, size: 22),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 0 — SELECT OPTION
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildOptionStep() {
    return Padding(
      key: const ValueKey(0),
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Sélectionnez une option',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 28),

          // Individual appointment
          _OptionCard(
            title: 'Prenez un rendez-vous',
            subtitle: 'Programmez des prestations pour vous',
            icon: Icons.person_outline_rounded,
            onTap: () {
              setState(() {
                _isGroupBooking = false;
                _step = 1;
              });
            },
          ),

          const SizedBox(height: 12),

          // Group appointment
          _OptionCard(
            title: 'Prendre un rendez-vous de groupe',
            subtitle: 'Pour vous-même et pour les autres',
            icon: Icons.groups_outlined,
            onTap: () {
              setState(() {
                _isGroupBooking = true;
                _step = 1;
              });
            },
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 1 — SELECT SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildServicesStep() {
    // Build category list from venue services
    final categories = <String>['À la une'];
    for (final s in widget.venue.services) {
      final cat = _guessCategory(s.name);
      if (!categories.contains(cat)) categories.add(cat);
    }

    return Column(
      key: const ValueKey(1),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
          child: Text(
            'Sélectionnez les\nprestations',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Category chips
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final isFirst = index == 0;
              return Container(
                margin: const EdgeInsets.only(right: 8),
                child: Material(
                  color: isFirst ? AppColors.primary : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {},
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isFirst ? AppColors.primary : AppColors.border,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            categories[index],
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: isFirst ? Colors.white : AppColors.textDark,
                            ),
                          ),
                          if (index == categories.length - 1) ...[
                            const SizedBox(width: 6),
                            Icon(
                              Icons.tune_rounded,
                              size: 16,
                              color: isFirst ? Colors.white : AppColors.textDark,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 16),

        // "À la une" section label
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'À la une',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Services list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
            itemCount: widget.venue.services.length,
            itemBuilder: (context, index) {
              final service = widget.venue.services[index];
              final isAdded = _selectedServices.any((s) => s.name == service.name);
              return _ServiceCard(
                service: service,
                isAdded: isAdded,
                onToggle: () {
                  setState(() {
                    if (isAdded) {
                      _selectedServices.removeWhere((s) => s.name == service.name);
                    } else {
                      _selectedServices.add(service);
                    }
                  });
                },
              );
            },
          ),
        ),

        // Bottom bar with total & continue
        if (_selectedServices.isNotEmpty)
          Container(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: const Border(top: BorderSide(color: AppColors.border)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${_totalPrice.toInt()} MAD',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textDark,
                        ),
                      ),
                      Text(
                        '${_selectedServices.length} article${_selectedServices.length > 1 ? 's' : ''} · $_durationLabel',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.textGray,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _step = 2),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Continuez',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  String _guessCategory(String serviceName) {
    final lower = serviceName.toLowerCase();
    if (lower.contains('hammam') || lower.contains('gommage')) return 'Hammam & Gommage';
    if (lower.contains('massage') || lower.contains('relaxa')) return 'Massage';
    if (lower.contains('coupe') || lower.contains('brushing') || lower.contains('coloration') || lower.contains('mèche')) return 'Coiffure';
    if (lower.contains('manucure') || lower.contains('pédicure') || lower.contains('vernis') || lower.contains('résine')) return 'Onglerie';
    if (lower.contains('barbe') || lower.contains('rasage')) return 'Barbier';
    if (lower.contains('épilation')) return 'Épilation';
    return 'Soins';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 2 — DATE & TIME
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildDateTimeStep() {
    return Column(
      key: const ValueKey(2),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title row
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  'Sélectionnez la date et\nl\'heure',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),
              ),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Icon(Icons.calendar_today_rounded, size: 20, color: AppColors.textDark),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // "Sélectionner une date"
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Sélectionner une date',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Horizontal date picker
        SizedBox(
          height: 82,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _nextDays.length,
            itemBuilder: (context, index) {
              final date = _nextDays[index];
              final isSelected = _selectedDate?.day == date.day &&
                  _selectedDate?.month == date.month &&
                  _selectedDate?.year == date.year;
              return GestureDetector(
                onTap: () => setState(() {
                  _selectedDate = date;
                  _selectedTime = null;
                }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(right: 10),
                  width: 60,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.purpleAccent : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppColors.purpleAccent : AppColors.border,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _dayAbbr(date),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isSelected ? Colors.white70 : AppColors.textGray,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${date.day}',
                        style: GoogleFonts.inter(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? Colors.white : AppColors.textDark,
                        ),
                      ),
                      Text(
                        _monthAbbr(date),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: isSelected ? Colors.white70 : AppColors.textGray,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 24),

        // "Choisissez une heure"
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Choisissez une heure',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Time slots (vertical list)
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            itemCount: _timeSlots.length,
            itemBuilder: (context, index) {
              final time = _timeSlots[index];
              final isSelected = _selectedTime == time;
              return GestureDetector(
                onTap: () => setState(() => _selectedTime = time),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.purpleAccent : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Text(
                    time,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                      color: isSelected ? AppColors.purpleAccent : AppColors.textDark,
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        // Bottom bar with price & continue
        Container(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(top: BorderSide(color: AppColors.border)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${_totalPrice.toInt()} MAD',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.shopping_bag_outlined, size: 13, color: AppColors.textGray),
                        const SizedBox(width: 4),
                        Text(
                          '${_selectedServices.length} article${_selectedServices.length > 1 ? 's' : ''} · $_durationLabel',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: _selectedTime != null
                    ? () => setState(() => _step = 3)
                    : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  decoration: BoxDecoration(
                    color: _selectedTime != null
                        ? AppColors.primary
                        : AppColors.border,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Continuez',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: _selectedTime != null
                              ? Colors.white
                              : AppColors.textGray,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        Icons.arrow_forward,
                        color: _selectedTime != null
                            ? Colors.white
                            : AppColors.textGray,
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 3 — LOGIN / REGISTER
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildLoginStep() {
    return SingleChildScrollView(
      key: const ValueKey(3),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Connectez-vous ou\ninscrivez-vous',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Nous devons vérifier qu\'il s\'agit bien de vous.',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textGray,
              height: 1.4,
            ),
          ),

          const SizedBox(height: 28),

          // Email label
          Text(
            'Adresse e-mail',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),

          // Email field
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: GoogleFonts.inter(fontSize: 15, color: AppColors.textDark),
            decoration: InputDecoration(
              hintText: 'Adresse e-mail',
              hintStyle: GoogleFonts.inter(color: AppColors.textLight, fontSize: 14),
              filled: true,
              fillColor: Colors.white,
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
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Nous vous enverrons un code de vérification',
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
          ),

          const SizedBox(height: 20),

          // Continue button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () => _handleLoginAndConfirm(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                'Continuez',
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // OR divider
          Row(
            children: [
              const Expanded(child: Divider(color: AppColors.border)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'OU',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textGray,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Expanded(child: Divider(color: AppColors.border)),
            ],
          ),

          const SizedBox(height: 24),

          // Phone button
          _SocialLoginButton(
            icon: Icons.phone_android_rounded,
            label: 'Continuer avec le téléphone\nportable',
            iconColor: AppColors.textDark,
            onTap: () => _handleLoginAndConfirm(),
          ),

          const SizedBox(height: 12),

          // Facebook button
          _SocialLoginButton(
            icon: Icons.facebook_rounded,
            label: 'Continuer avec Facebook',
            iconColor: AppColors.facebookBlue,
            onTap: () => _handleLoginAndConfirm(),
          ),

          const SizedBox(height: 12),

          // Google button
          _SocialLoginButton(
            customIcon: Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  'G',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFEA4335),
                  ),
                ),
              ),
            ),
            label: 'Continuer avec Google',
            onTap: () => _handleLoginAndConfirm(),
          ),
        ],
      ),
    );
  }

  void _handleLoginAndConfirm() {
    // Show loading then navigate to confirmation
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        Navigator.pop(context); // Close loader
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookingConfirmationScreen(
              venue: widget.venue,
              service: _selectedServices.first,
              date: _selectedDate != null ? _formatFullDate(_selectedDate!) : '',
              time: _selectedTime ?? '',
            ),
          ),
        );
      }
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  WIDGETS
// ═════════════════════════════════════════════════════════════════════════════

/// Step 0 – Option card (individual / group)
class _OptionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const _OptionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppColors.textGray,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Icon(icon, size: 28, color: AppColors.textDark),
          ],
        ),
      ),
    );
  }
}

/// Step 1 – Service card with add (+) / remove (−) button
class _ServiceCard extends StatelessWidget {
  final ServiceItem service;
  final bool isAdded;
  final VoidCallback onToggle;

  const _ServiceCard({
    required this.service,
    required this.isAdded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final durationLabel = service.durationMin >= 60
        ? '${service.durationMin ~/ 60} h${service.durationMin % 60 > 0 ? ' ${service.durationMin % 60} min' : ''}'
        : '${service.durationMin} min';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isAdded ? AppColors.primary : AppColors.border,
          width: isAdded ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            service.name.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            durationLabel,
            style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray),
          ),
          const SizedBox(height: 6),
          Text(
            service.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.textGray,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${service.price.toInt()} MAD',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              GestureDetector(
                onTap: onToggle,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isAdded ? AppColors.primary : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isAdded ? AppColors.primary : AppColors.border,
                      width: 1.5,
                    ),
                  ),
                  child: Icon(
                    isAdded ? Icons.remove : Icons.add,
                    size: 20,
                    color: isAdded ? Colors.white : AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Step 3 – Social login button
class _SocialLoginButton extends StatelessWidget {
  final IconData? icon;
  final Widget? customIcon;
  final String label;
  final Color? iconColor;
  final VoidCallback onTap;

  const _SocialLoginButton({
    this.icon,
    this.customIcon,
    required this.label,
    this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            if (customIcon != null)
              customIcon!
            else
              Icon(icon, size: 22, color: iconColor ?? AppColors.textDark),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textDark,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
