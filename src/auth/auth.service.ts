import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar contraseña
    const isPasswordValid = await this.usersService.validatePassword(
      password, 
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Actualizar último login
    await this.usersService.updateLastLogin(user.id);

    // Generar JWT
    const payload = { 
      sub: user.id, 
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login exitoso',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Crear usuario
    const user = await this.usersService.create(email, password, name);

    // Generar JWT automáticamente después del registro
    const payload = { 
      sub: user.id, 
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Usuario registrado exitosamente',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async validateUser(userId: number) {
    return await this.usersService.findById(userId);
  }
}
