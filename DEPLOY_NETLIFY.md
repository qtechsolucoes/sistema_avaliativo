# Configuração do Netlify para projeto sem build
[build]
  # Sem comando de build (projeto vanilla)
  command = ""
  # Publica da raiz do projeto
  publish = "."

# Configurações de ambiente
[build.environment]
  # Node version (caso precise)
  NODE_VERSION = "18"

# Redirecionamentos para SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false

# Headers de segurança
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "no-referrer-when-downgrade"

# Cache para arquivos estáticos
[[headers]]
  for = "/src/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/styles/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Não faz cache do index.html
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
