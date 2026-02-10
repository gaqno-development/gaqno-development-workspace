import { HttpService } from "@nestjs/axios";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { AxiosError } from "axios";
import { SessionContext } from "@gaqno-development/types";

@Injectable()
export class SsoService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {}

  async verify(request: Request): Promise<SessionContext> {
    try {
      const { data } = await this.http.axiosRef.get<SessionContext>(
        `${this.config.get<string>("SSO_INTROSPECTION_URL")}/auth/verify`,
        {
          headers: {
            cookie: this.forwardCookies(request),
          },
          withCredentials: true,
        }
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new UnauthorizedException();
      }
      throw error;
    }
  }

  private forwardCookies(request: Request): string {
    const sessionName =
      this.config.get<string>("SESSION_COOKIE_NAME") ?? "gaqno_session";
    const refreshName =
      this.config.get<string>("REFRESH_COOKIE_NAME") ?? "gaqno_refresh";
    const session = request.cookies?.[sessionName];
    const refresh = request.cookies?.[refreshName];
    const pairs = [];
    if (session) {
      pairs.push(`${sessionName}=${session}`);
    }
    if (refresh) {
      pairs.push(`${refreshName}=${refresh}`);
    }
    return pairs.join("; ");
  }
}
