export class CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export class UpdateUserDto {
  email?: string;
  name?: string;
}
