package com.showzo.auth;

import com.showzo.auth.AuthDtos.AuthResponse;
import com.showzo.auth.AuthDtos.LoginRequest;
import com.showzo.auth.AuthDtos.RegisterRequest;
import com.showzo.auth.AuthDtos.UserDto;
import com.showzo.common.ConflictException;
import com.showzo.common.NotFoundException;
import com.showzo.user.Role;
import com.showzo.user.User;
import com.showzo.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalise(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = userRepository.save(new User(
                request.name().trim(), email, passwordEncoder.encode(request.password()), Role.USER));
        return new AuthResponse(jwtService.createToken(user), UserDto.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Same error for "no such email" and "wrong password", so nobody can probe which emails are registered.
        User user = userRepository.findByEmail(normalise(request.email()))
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Incorrect email or password"));
        return new AuthResponse(jwtService.createToken(user), UserDto.from(user));
    }

    @Transactional(readOnly = true)
    public UserDto currentUser(String email) {
        return userRepository.findByEmail(email)
                .map(UserDto::from)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
