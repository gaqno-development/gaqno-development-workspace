#!/usr/bin/env node
/**
 * Script simples para testar o MCP Server
 * 
 * Uso:
 *   node test-mcp-simple.js
 */

const { spawn } = require('child_process');
const path = require('path');

const MCP_PATH = process.env.DND_MCP_PATH || '/home/kursk/.local/bin/uv';
const MCP_DIR = process.env.DND_MCP_DIR || '/home/kursk/coding/gaqno_server/dnd-mcp';

console.log('🧪 Testando MCP Server...\n');
console.log(`MCP Path: ${MCP_PATH}`);
console.log(`MCP Dir: ${MCP_DIR}\n`);

// Teste 1: Verificar se o servidor inicia
console.log('1️⃣ Testando inicialização do servidor...');
const server = spawn(MCP_PATH, [
  'run',
  '--directory',
  MCP_DIR,
  'python',
  'dnd_mcp_server.py'
], {
  cwd: MCP_DIR,
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log('📤 Server stdout:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  serverError += data.toString();
  console.log('📤 Server stderr:', data.toString().trim());
});

server.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error.message);
  process.exit(1);
});

// Aguardar um pouco para ver se o servidor inicia
setTimeout(() => {
  console.log('\n✅ Servidor iniciado com sucesso!');
  console.log('\n📝 Para testar via API, use:');
  console.log('   curl -X POST http://localhost:4007/v1/rpg/campaigns/{id}/locations/generate \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "Cookie: gaqno_session=YOUR_TOKEN" \\');
  console.log('     -d \'{"name": "Test", "type": "dungeon"}\'');
  console.log('\n🛑 Pressione Ctrl+C para parar o servidor');
  
  server.kill();
  process.exit(0);
}, 3000);

process.on('SIGINT', () => {
  console.log('\n\n🛑 Parando servidor...');
  server.kill();
  process.exit(0);
});

