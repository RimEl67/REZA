import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  bool _isLogin = true;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _keepLoggedIn = false;
  bool _acceptTerms = false;
  bool _loading = false;
  String _error = '';

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();

  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  // Animated messages
  final List<Map<String, String>> _messages = [
    {
      'title': 'Gestion simplifiée de votre établissement',
      'subtitle': 'Pilotez votre activité en toute sérénité et gagnez du temps chaque jour.',
    },
    {
      'title': 'Gérez vos rdv de manière efficace',
      'subtitle': 'Planifiez, suivez et optimisez vos rendez-vous sans effort.',
    },
    {
      'title': 'Optimisez votre temps et vos ressources',
      'subtitle': 'Automatisez les tâches répétitives et concentrez-vous sur l\'essentiel.',
    },
    {
      'title': 'Restez organisé à tout moment',
      'subtitle': 'Accédez à vos outils où que vous soyez, sur tous vos appareils.',
    },
  ];
  int _messageIndex = 0;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = Tween<double>(begin: 1, end: 0).animate(_animController);

    Future.delayed(const Duration(seconds: 1), _startMessageLoop);
  }

  void _startMessageLoop() {
    if (!mounted) return;
    Future.delayed(const Duration(seconds: 4), () async {
      if (!mounted) return;
      await _animController.forward();
      if (!mounted) return;
      setState(() {
        _messageIndex = (_messageIndex + 1) % _messages.length;
      });
      await _animController.reverse();
      _startMessageLoop();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() => _error = '');

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Veuillez remplir tous les champs');
      return;
    }

    setState(() => _loading = true);

    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      setState(() => _loading = false);

      // Mock credentials
      if (email == 'admin@wellbe.ma' && password == 'admin123') {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      } else {
        setState(() => _error = 'Email ou mot de passe invalide');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _loading
          ? _buildLoadingScreen()
          : SingleChildScrollView(
              child: Column(
                children: [
                  _buildHeroSection(),
                  _buildFormSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildLoadingScreen() {
    return Container(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.spa_rounded, color: Colors.white, size: 36),
            ),
            const SizedBox(height: 24),
            Text(
              'WellBePro',
              style: GoogleFonts.outfit(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 40,
              height: 40,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: AppColors.primary,
                backgroundColor: AppColors.primary.withOpacity(0.15),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Connexion en cours...',
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: AppColors.textGray,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      height: 320,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF047857), Color(0xFF059669), Color(0xFF10B981)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.35),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.07),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -20,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.07),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: const Icon(
                        Icons.spa_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'WellBePro',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                // Animated message
                FadeTransition(
                  opacity: _fadeAnim.drive(
                    Tween<double>(begin: 0, end: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _messages[_messageIndex]['title']!,
                        style: GoogleFonts.outfit(
                          fontSize: 19,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _messages[_messageIndex]['subtitle']!,
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.8),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Progress dots
                Row(
                  children: List.generate(_messages.length, (i) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(right: 6),
                      width: i == _messageIndex ? 24 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: i == _messageIndex
                            ? Colors.white
                            : Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bienvenue !',
            style: GoogleFonts.outfit(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                _isLogin
                    ? 'Pas encore de compte ? '
                    : 'Vous avez déjà un compte ? ',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: AppColors.textGray,
                ),
              ),
              GestureDetector(
                onTap: () => setState(() {
                  _isLogin = !_isLogin;
                  _error = '';
                }),
                child: Text(
                  _isLogin ? 'S\'inscrire' : 'Se connecter',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // Signup extra fields
          if (!_isLogin) ...[
            Row(
              children: [
                Expanded(
                  child: _buildInput(
                    controller: _firstNameController,
                    label: 'Prénom',
                    hint: 'Jean',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildInput(
                    controller: _lastNameController,
                    label: 'Nom',
                    hint: 'Dupont',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],

          _buildInput(
            controller: _emailController,
            label: 'Email',
            hint: 'vous@exemple.com',
            icon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          _buildInput(
            controller: _passwordController,
            label: 'Mot de passe',
            hint: '••••••••',
            obscure: !_showPassword,
            suffixIcon: IconButton(
              icon: Icon(
                _showPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: AppColors.textGray,
                size: 20,
              ),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
          ),
          if (!_isLogin) ...[
            const SizedBox(height: 16),
            _buildInput(
              controller: _confirmPasswordController,
              label: 'Confirmer le mot de passe',
              hint: '••••••••',
              obscure: !_showConfirmPassword,
              suffixIcon: IconButton(
                icon: Icon(
                  _showConfirmPassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  color: AppColors.textGray,
                  size: 20,
                ),
                onPressed: () =>
                    setState(() => _showConfirmPassword = !_showConfirmPassword),
              ),
            ),
          ],
          const SizedBox(height: 16),

          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppColors.cancelledBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cancelled.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.cancelled, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error,
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: AppColors.cancelled,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          if (_isLogin)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Checkbox(
                      value: _keepLoggedIn,
                      onChanged: (v) => setState(() => _keepLoggedIn = v ?? false),
                      activeColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    Text(
                      'Rester connecté',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textGray,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () {},
                  child: Text(
                    'Mot de passe oublié ?',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                Checkbox(
                  value: _acceptTerms,
                  onChanged: (v) => setState(() => _acceptTerms = v ?? false),
                  activeColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      text: 'J\'accepte les ',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        color: AppColors.textGray,
                      ),
                      children: [
                        TextSpan(
                          text: 'conditions d\'utilisation',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                        const TextSpan(text: ' et la '),
                        TextSpan(
                          text: 'politique de confidentialité',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

          const SizedBox(height: 20),

          // Submit button
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(27),
                ),
              ),
              child: Text(
                _isLogin ? 'Se connecter' : 'Créer un compte',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),

          Row(
            children: [
              const Expanded(child: Divider()),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  'OU',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
              ),
              const Expanded(child: Divider()),
            ],
          ),
          const SizedBox(height: 16),

          // Google button
          SizedBox(
            width: double.infinity,
            height: 54,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: _googleIcon(),
              label: Text(
                'Se connecter avec Google',
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textDark,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border, width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(27),
                ),
                backgroundColor: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'SSL Connexion sécurisée et privée',
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: AppColors.textLight,
              ),
            ),
          ),

          // Demo hint
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.2),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '🔑 Accès démo',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Email: admin@wellbe.ma\nMot de passe: admin123',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    color: AppColors.textGray,
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInput({
    required TextEditingController controller,
    required String label,
    required String hint,
    IconData? icon,
    Widget? suffixIcon,
    bool obscure = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.textDark,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.outfit(
              fontSize: 14,
              color: AppColors.textLight,
            ),
            suffixIcon: suffixIcon ??
                (icon != null
                    ? Icon(icon, color: AppColors.textGray, size: 20)
                    : null),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  Widget _googleIcon() {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleIconPainter()),
    );
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // Blue
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(Rect.fromLTWH(0, 0, size.width, size.height), -1.57, 3.14, true, paint);

    // Red
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(Rect.fromLTWH(0, 0, size.width, size.height), -1.57, -3.14, true, paint);

    // Green
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(Rect.fromLTWH(0, 0, size.width, size.height), 1.57, 1.57, true, paint);

    // Yellow
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(Rect.fromLTWH(0, 0, size.width, size.height), 1.57, -1.57, true, paint);

    // Center white
    paint.color = Colors.white;
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width * 0.35, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
