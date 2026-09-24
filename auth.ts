import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const allowedLogin = process.env.ALLOWED_GITHUB_LOGIN?.toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  // needed behind a reverse proxy (self-hosted Docker), where the request
  // host isn't one Auth.js recognizes automatically like *.vercel.app
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!allowedLogin) return true;
      const login = (profile as { login?: string } | undefined)?.login?.toLowerCase();
      return login === allowedLogin;
    },
  },
});
