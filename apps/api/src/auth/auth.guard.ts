import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const email = String(req.headers["x-user-email"] ?? "").toLowerCase().trim();

    if (!email.endsWith("@ufcspa.edu.br")) {
      throw new UnauthorizedException("Acesso restrito a e-mail institucional.");
    }

    const allowed = String(this.config.get("ALLOWED_EMAILS") ?? "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    if (!allowed.includes(email)) {
      throw new UnauthorizedException("E-mail não autorizado.");
    }

    req.userEmail = email;
    return true;
  }
}