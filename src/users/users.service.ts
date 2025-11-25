import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    password: string,
    fullName: string,
    username?: string,
  ): Promise<User> {
    // Verificar si el usuario ya existe por email
    const existingUserByEmail = await this.usersRepository.findOne({ 
      where: { email } 
    });
    if (existingUserByEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Generar username automáticamente si no se proporciona
    const generatedUsername = username || email.split('@')[0];

    // Verificar si el username ya existe
    const existingUserByUsername = await this.usersRepository.findOne({ 
      where: { username: generatedUsername } 
    });
    if (existingUserByUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      fullName,
      username: generatedUsername,
      role: UserRole.VIEWER,
      isActive: true,
    });

    return await this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { 
      lastLogin: new Date() 
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
