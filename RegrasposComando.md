REGRAS GLOBAIS (OBRIGATÓRIAS):

1. PRESERVAÇÃO DO SISTEMA
- Nunca alterar código que já esteja funcionando corretamente
- Só alterar se:
  a) houver erro comprovado
  b) houver vulnerabilidade de segurança

2. VALIDAÇÃO
- Nunca confiar em validações do frontend
- Frontend:
  - validação apenas para UX (não segurança)
- Backend:
  - toda validação deve ser feita obrigatoriamente

3. SEGURANÇA (PRIORIDADE MÁXIMA)
- Todo código deve ser escrito com foco em segurança
- Sempre:
  - validar e sanitizar inputs
  - proteger contra XSS, SQL Injection, CSRF
  - usar boas práticas modernas
- Nunca:
  - expor dados sensíveis
  - confiar em dados do cliente

4. ALTERAÇÕES DE CÓDIGO
- Mudanças devem ser mínimas e cirúrgicas
- Não refatorar desnecessariamente
- Não alterar arquitetura sem necessidade

5. CONSISTÊNCIA
- Garantir compatibilidade entre backend e frontend
- Não quebrar APIs existentes

6. EXPLICAÇÃO
- Toda alteração deve ser explicada de forma objetiva
- Informar risco e impacto da mudança

7. MODO PRODUÇÃO
- Assumir que o sistema está em produção
- Evitar mudanças que possam causar downtime
- Priorizar estabilidade sobre otimização

8. ZERO TRUST
- Todo input é considerado malicioso até prova contrária
- Nenhuma entrada deve ser usada diretamente

9. FAIL SAFE
- Em caso de erro, o sistema deve falhar de forma segura
- Nunca expor stacktrace ou detalhes internos