import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // ============================================================================
  // CATEGORÍAS
  // ============================================================================
  console.log('📦 Creando categorías...')
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: 'EPP' },
      update: {},
      create: { nombre: 'EPP' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'EQUIPO' },
      update: {},
      create: { nombre: 'EQUIPO' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'MATERIAL' },
      update: {},
      create: { nombre: 'MATERIAL' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'HERRAMIENTA' },
      update: {},
      create: { nombre: 'HERRAMIENTA' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'ACCESORIO' },
      update: {},
      create: { nombre: 'ACCESORIO' },
    }),
  ])
  console.log(`   ✓ ${categorias.length} categorías creadas`)

  // ============================================================================
  // UNIDADES DE MEDIDA
  // ============================================================================
  console.log('📏 Creando unidades de medida...')
  const unidades = await Promise.all([
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'UND' },
      update: {},
      create: { nombre: 'Unidad', abreviatura: 'UND' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'PAR' },
      update: {},
      create: { nombre: 'Par', abreviatura: 'PAR' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'JGO' },
      update: {},
      create: { nombre: 'Juego', abreviatura: 'JGO' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'CJ' },
      update: {},
      create: { nombre: 'Caja', abreviatura: 'CJ' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'KG' },
      update: {},
      create: { nombre: 'Kilogramo', abreviatura: 'KG' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'M' },
      update: {},
      create: { nombre: 'Metro', abreviatura: 'M' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'LT' },
      update: {},
      create: { nombre: 'Litro', abreviatura: 'LT' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'GL' },
      update: {},
      create: { nombre: 'Galón', abreviatura: 'GL' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'RLL' },
      update: {},
      create: { nombre: 'Rollo', abreviatura: 'RLL' },
    }),
    prisma.unidadMedida.upsert({
      where: { abreviatura: 'BLS' },
      update: {},
      create: { nombre: 'Bolsa', abreviatura: 'BLS' },
    }),
  ])
  console.log(`   ✓ ${unidades.length} unidades de medida creadas`)

  // ============================================================================
  // MARCAS
  // ============================================================================
  console.log('🏷️  Creando marcas...')
  const marcas = await Promise.all([
    prisma.marca.upsert({
      where: { nombre: '3M' },
      update: {},
      create: { nombre: '3M' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Bosch' },
      update: {},
      create: { nombre: 'Bosch' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Stanley' },
      update: {},
      create: { nombre: 'Stanley' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Milwaukee' },
      update: {},
      create: { nombre: 'Milwaukee' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Truper' },
      update: {},
      create: { nombre: 'Truper' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Ansell' },
      update: {},
      create: { nombre: 'Ansell' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'DeWalt' },
      update: {},
      create: { nombre: 'DeWalt' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Caterpillar' },
      update: {},
      create: { nombre: 'Caterpillar' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Fluke' },
      update: {},
      create: { nombre: 'Fluke' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Motorola' },
      update: {},
      create: { nombre: 'Motorola' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'INDECO' },
      update: {},
      create: { nombre: 'INDECO' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Makita' },
      update: {},
      create: { nombre: 'Makita' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Black+Decker' },
      update: {},
      create: { nombre: 'Black+Decker' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Klein Tools' },
      update: {},
      create: { nombre: 'Klein Tools' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'Honeywell' },
      update: {},
      create: { nombre: 'Honeywell' },
    }),
    prisma.marca.upsert({
      where: { nombre: 'MSA' },
      update: {},
      create: { nombre: 'MSA' },
    }),
  ])
  console.log(`   ✓ ${marcas.length} marcas creadas`)

  // ============================================================================
  // MODELOS
  // ============================================================================
  console.log('📋 Creando modelos...')

  const marca3M = marcas.find(m => m.nombre === '3M')!
  const marcaBosch = marcas.find(m => m.nombre === 'Bosch')!
  const marcaStanley = marcas.find(m => m.nombre === 'Stanley')!
  const marcaTruper = marcas.find(m => m.nombre === 'Truper')!
  const marcaAnsell = marcas.find(m => m.nombre === 'Ansell')!
  const marcaDeWalt = marcas.find(m => m.nombre === 'DeWalt')!
  const marcaCaterpillar = marcas.find(m => m.nombre === 'Caterpillar')!
  const marcaFluke = marcas.find(m => m.nombre === 'Fluke')!
  const marcaMotorola = marcas.find(m => m.nombre === 'Motorola')!
  const marcaINDECO = marcas.find(m => m.nombre === 'INDECO')!
  const marcaMakita = marcas.find(m => m.nombre === 'Makita')!
  const marcaBlackDecker = marcas.find(m => m.nombre === 'Black+Decker')!
  const marcaKleinTools = marcas.find(m => m.nombre === 'Klein Tools')!
  const marcaHoneywell = marcas.find(m => m.nombre === 'Honeywell')!
  const marcaMSA = marcas.find(m => m.nombre === 'MSA')!

  const modelos = await Promise.all([
    // 3M
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marca3M.id, nombre: 'H-700' } },
      update: {},
      create: { nombre: 'H-700', marcaId: marca3M.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marca3M.id, nombre: 'SecureFit' } },
      update: {},
      create: { nombre: 'SecureFit', marcaId: marca3M.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marca3M.id, nombre: 'Protecta' } },
      update: {},
      create: { nombre: 'Protecta', marcaId: marca3M.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marca3M.id, nombre: '1700' } },
      update: {},
      create: { nombre: '1700', marcaId: marca3M.id },
    }),
    // Bosch
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaBosch.id, nombre: 'GSB 13 RE' } },
      update: {},
      create: { nombre: 'GSB 13 RE', marcaId: marcaBosch.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaBosch.id, nombre: 'GBH 2-28 F' } },
      update: {},
      create: { nombre: 'GBH 2-28 F', marcaId: marcaBosch.id },
    }),
    // Stanley
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaStanley.id, nombre: 'STMT74858' } },
      update: {},
      create: { nombre: 'STMT74858', marcaId: marcaStanley.id },
    }),
    // Truper
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaTruper.id, nombre: 'CR-120' } },
      update: {},
      create: { nombre: 'CR-120', marcaId: marcaTruper.id },
    }),
    // Ansell
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaAnsell.id, nombre: 'TouchNTuff' } },
      update: {},
      create: { nombre: 'TouchNTuff', marcaId: marcaAnsell.id },
    }),
    // DeWalt
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaDeWalt.id, nombre: 'DWE4120' } },
      update: {},
      create: { nombre: 'DWE4120', marcaId: marcaDeWalt.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaDeWalt.id, nombre: 'DCD771C2' } },
      update: {},
      create: { nombre: 'DCD771C2', marcaId: marcaDeWalt.id },
    }),
    // Caterpillar
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaCaterpillar.id, nombre: 'Holton' } },
      update: {},
      create: { nombre: 'Holton', marcaId: marcaCaterpillar.id },
    }),
    // Fluke
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaFluke.id, nombre: '117' } },
      update: {},
      create: { nombre: '117', marcaId: marcaFluke.id },
    }),
    // Motorola
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaMotorola.id, nombre: 'T82' } },
      update: {},
      create: { nombre: 'T82', marcaId: marcaMotorola.id },
    }),
    // INDECO
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaINDECO.id, nombre: 'THW-14' } },
      update: {},
      create: { nombre: 'THW-14', marcaId: marcaINDECO.id },
    }),
    // Makita
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaMakita.id, nombre: 'XPH12Z' } },
      update: {},
      create: { nombre: 'XPH12Z', marcaId: marcaMakita.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaMakita.id, nombre: 'GA5030' } },
      update: {},
      create: { nombre: 'GA5030', marcaId: marcaMakita.id },
    }),
    // Black+Decker
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaBlackDecker.id, nombre: 'BDCDD12C' } },
      update: {},
      create: { nombre: 'BDCDD12C', marcaId: marcaBlackDecker.id },
    }),
    // Klein Tools
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaKleinTools.id, nombre: 'D2000-9NE' } },
      update: {},
      create: { nombre: 'D2000-9NE', marcaId: marcaKleinTools.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaKleinTools.id, nombre: '1000V' } },
      update: {},
      create: { nombre: '1000V', marcaId: marcaKleinTools.id },
    }),
    // Honeywell
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaHoneywell.id, nombre: 'North 7700' } },
      update: {},
      create: { nombre: 'North 7700', marcaId: marcaHoneywell.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaHoneywell.id, nombre: 'Uvex Genesis' } },
      update: {},
      create: { nombre: 'Uvex Genesis', marcaId: marcaHoneywell.id },
    }),
    // MSA
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaMSA.id, nombre: 'V-Gard' } },
      update: {},
      create: { nombre: 'V-Gard', marcaId: marcaMSA.id },
    }),
    prisma.modelo.upsert({
      where: { marcaId_nombre: { marcaId: marcaMSA.id, nombre: 'Altair 5X' } },
      update: {},
      create: { nombre: 'Altair 5X', marcaId: marcaMSA.id },
    }),
  ])
  console.log(`   ✓ ${modelos.length} modelos creados`)

  // ============================================================================
  // OPERACIONES
  // ============================================================================
  console.log('🏭 Creando operaciones...')
  const operaciones = await Promise.all([
    prisma.operacion.upsert({
      where: { codigo: 'OP-NORTE' },
      update: {},
      create: { nombre: 'Operación Norte', codigo: 'OP-NORTE' },
    }),
    prisma.operacion.upsert({
      where: { codigo: 'OP-SUR' },
      update: {},
      create: { nombre: 'Operación Sur', codigo: 'OP-SUR' },
    }),
    prisma.operacion.upsert({
      where: { codigo: 'OP-CENTRAL' },
      update: {},
      create: { nombre: 'Operación Central', codigo: 'OP-CENTRAL' },
    }),
    prisma.operacion.upsert({
      where: { codigo: 'MINA-A' },
      update: {},
      create: { nombre: 'Operación Mina A', codigo: 'MINA-A' },
    }),
    prisma.operacion.upsert({
      where: { codigo: 'MINA-B' },
      update: {},
      create: { nombre: 'Operación Mina B', codigo: 'MINA-B' },
    }),
    prisma.operacion.upsert({
      where: { codigo: 'PLANTA' },
      update: {},
      create: { nombre: 'Planta Principal', codigo: 'PLANTA' },
    }),
    prisma.operacion.upsert({
      where: { codigo: 'ALMACEN' },
      update: {},
      create: { nombre: 'Almacén Central', codigo: 'ALMACEN' },
    }),
  ])
  console.log(`   ✓ ${operaciones.length} operaciones creadas`)

  // ============================================================================
  // CENTROS DE COSTO
  // ============================================================================
  console.log('💰 Creando centros de costo...')
  const centrosCosto = await Promise.all([
    prisma.centroCosto.upsert({
      where: { codigo: 'CC-001' },
      update: {},
      create: { nombre: 'Mantenimiento', codigo: 'CC-001' },
    }),
    prisma.centroCosto.upsert({
      where: { codigo: 'CC-002' },
      update: {},
      create: { nombre: 'Producción', codigo: 'CC-002' },
    }),
    prisma.centroCosto.upsert({
      where: { codigo: 'CC-003' },
      update: {},
      create: { nombre: 'Seguridad', codigo: 'CC-003' },
    }),
    prisma.centroCosto.upsert({
      where: { codigo: 'CC-004' },
      update: {},
      create: { nombre: 'Logística', codigo: 'CC-004' },
    }),
    prisma.centroCosto.upsert({
      where: { codigo: 'CC-005' },
      update: {},
      create: { nombre: 'Administración', codigo: 'CC-005' },
    }),
    prisma.centroCosto.upsert({
      where: { codigo: 'CC-006' },
      update: {},
      create: { nombre: 'Operaciones', codigo: 'CC-006' },
    }),
  ])
  console.log(`   ✓ ${centrosCosto.length} centros de costo creados`)

  // ============================================================================
  // USUARIOS
  // ============================================================================
  console.log('👥 Creando usuarios...')

  const defaultPassword = await hash('password123', 12)

  const usuarios = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@empresa.com' },
      update: {},
      create: {
        email: 'admin@empresa.com',
        password: defaultPassword,
        nombre: 'Administrador Sistema',
        rol: UserRole.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'tecnico@empresa.com' },
      update: {},
      create: {
        email: 'tecnico@empresa.com',
        password: defaultPassword,
        nombre: 'Juan Pérez',
        rol: UserRole.TECNICO,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seguridad@empresa.com' },
      update: {},
      create: {
        email: 'seguridad@empresa.com',
        password: defaultPassword,
        nombre: 'María García',
        rol: UserRole.SEGURIDAD,
      },
    }),
    prisma.user.upsert({
      where: { email: 'gerencia@empresa.com' },
      update: {},
      create: {
        email: 'gerencia@empresa.com',
        password: defaultPassword,
        nombre: 'Carlos López',
        rol: UserRole.GERENCIA,
      },
    }),
    prisma.user.upsert({
      where: { email: 'logistica@empresa.com' },
      update: {},
      create: {
        email: 'logistica@empresa.com',
        password: defaultPassword,
        nombre: 'Ana Martínez',
        rol: UserRole.LOGISTICA,
      },
    }),
    prisma.user.upsert({
      where: { email: 'administracion@empresa.com' },
      update: {},
      create: {
        email: 'administracion@empresa.com',
        password: defaultPassword,
        nombre: 'Roberto Silva',
        rol: UserRole.ADMINISTRACION,
      },
    }),
    prisma.user.upsert({
      where: { email: 'receptor@empresa.com' },
      update: {},
      create: {
        email: 'receptor@empresa.com',
        password: defaultPassword,
        nombre: 'Luis Torres',
        rol: UserRole.RECEPTOR,
      },
    }),
  ])
  console.log(`   ✓ ${usuarios.length} usuarios creados`)

  // ============================================================================
  // PRODUCTOS DE CATÁLOGO
  // ============================================================================
  console.log('📦 Creando productos del catálogo...')

  const categoriaEPP = categorias.find(c => c.nombre === 'EPP')!
  const categoriaEquipo = categorias.find(c => c.nombre === 'EQUIPO')!
  const categoriaHerramienta = categorias.find(c => c.nombre === 'HERRAMIENTA')!
  const categoriaMaterial = categorias.find(c => c.nombre === 'MATERIAL')!
  const categoriaAccesorio = categorias.find(c => c.nombre === 'ACCESORIO')!

  // Obtener modelos para productos
  const modeloH700 = modelos.find(m => m.nombre === 'H-700')!
  const modeloSecureFit = modelos.find(m => m.nombre === 'SecureFit')!
  const modeloProtecta = modelos.find(m => m.nombre === 'Protecta')!
  const modeloTouchNTuff = modelos.find(m => m.nombre === 'TouchNTuff')!
  const modeloCR120 = modelos.find(m => m.nombre === 'CR-120')!
  const modeloHolton = modelos.find(m => m.nombre === 'Holton')!
  const modeloGSB13RE = modelos.find(m => m.nombre === 'GSB 13 RE')!
  const modeloGBH228F = modelos.find(m => m.nombre === 'GBH 2-28 F')!
  const modeloDWE4120 = modelos.find(m => m.nombre === 'DWE4120')!
  const modeloDCD771C2 = modelos.find(m => m.nombre === 'DCD771C2')!
  const modeloSTMT74858 = modelos.find(m => m.nombre === 'STMT74858')!
  const modelo117 = modelos.find(m => m.nombre === '117')!
  const modeloT82 = modelos.find(m => m.nombre === 'T82')!
  const modelo1700 = modelos.find(m => m.nombre === '1700')!
  const modeloTHW14 = modelos.find(m => m.nombre === 'THW-14')!
  const modeloXPH12Z = modelos.find(m => m.nombre === 'XPH12Z')!
  const modeloGA5030 = modelos.find(m => m.nombre === 'GA5030')!
  const modeloBDCDD12C = modelos.find(m => m.nombre === 'BDCDD12C')!
  const modeloD20009NE = modelos.find(m => m.nombre === 'D2000-9NE')!
  const modelo1000V = modelos.find(m => m.nombre === '1000V')!
  const modeloNorth7700 = modelos.find(m => m.nombre === 'North 7700')!
  const modeloUvexGenesis = modelos.find(m => m.nombre === 'Uvex Genesis')!
  const modeloVGard = modelos.find(m => m.nombre === 'V-Gard')!
  const modeloAltair5X = modelos.find(m => m.nombre === 'Altair 5X')!

  const productos = await Promise.all([
    // EPP
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-001' },
      update: {},
      create: {
        numeroParte: 'EPP-001',
        descripcion: 'Casco de seguridad',
        marcaId: marca3M.id,
        modeloId: modeloH700.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-002' },
      update: {},
      create: {
        numeroParte: 'EPP-002',
        descripcion: 'Guantes de nitrilo',
        marcaId: marcaAnsell.id,
        modeloId: modeloTouchNTuff.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-003' },
      update: {},
      create: {
        numeroParte: 'EPP-003',
        descripcion: 'Lentes de seguridad',
        marcaId: marca3M.id,
        modeloId: modeloSecureFit.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-004' },
      update: {},
      create: {
        numeroParte: 'EPP-004',
        descripcion: 'Botas de seguridad',
        marcaId: marcaCaterpillar.id,
        modeloId: modeloHolton.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-005' },
      update: {},
      create: {
        numeroParte: 'EPP-005',
        descripcion: 'Chaleco reflectivo',
        marcaId: marcaTruper.id,
        modeloId: modeloCR120.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-006' },
      update: {},
      create: {
        numeroParte: 'EPP-006',
        descripcion: 'Arnés de seguridad',
        marcaId: marca3M.id,
        modeloId: modeloProtecta.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    // Herramientas
    prisma.producto.upsert({
      where: { numeroParte: 'HER-001' },
      update: {},
      create: {
        numeroParte: 'HER-001',
        descripcion: 'Taladro percutor',
        marcaId: marcaBosch.id,
        modeloId: modeloGSB13RE.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-002' },
      update: {},
      create: {
        numeroParte: 'HER-002',
        descripcion: 'Amoladora angular',
        marcaId: marcaDeWalt.id,
        modeloId: modeloDWE4120.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-003' },
      update: {},
      create: {
        numeroParte: 'HER-003',
        descripcion: 'Juego de llaves',
        marcaId: marcaStanley.id,
        modeloId: modeloSTMT74858.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    // Equipos
    prisma.producto.upsert({
      where: { numeroParte: 'EQU-001' },
      update: {},
      create: {
        numeroParte: 'EQU-001',
        descripcion: 'Multímetro digital',
        marcaId: marcaFluke.id,
        modeloId: modelo117.id,
        categoriaId: categoriaEquipo.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EQU-002' },
      update: {},
      create: {
        numeroParte: 'EQU-002',
        descripcion: 'Radio portátil',
        marcaId: marcaMotorola.id,
        modeloId: modeloT82.id,
        categoriaId: categoriaEquipo.id,
      },
    }),
    // Materiales
    prisma.producto.upsert({
      where: { numeroParte: 'MAT-001' },
      update: {},
      create: {
        numeroParte: 'MAT-001',
        descripcion: 'Cinta aislante',
        marcaId: marca3M.id,
        modeloId: modelo1700.id,
        categoriaId: categoriaMaterial.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'MAT-002' },
      update: {},
      create: {
        numeroParte: 'MAT-002',
        descripcion: 'Cable eléctrico THW-14',
        marcaId: marcaINDECO.id,
        modeloId: modeloTHW14.id,
        categoriaId: categoriaMaterial.id,
      },
    }),
    // Accesorios adicionales
    prisma.producto.upsert({
      where: { numeroParte: 'ACC-001' },
      update: {},
      create: {
        numeroParte: 'ACC-001',
        descripcion: 'Batería recargable',
        marcaId: marcaDeWalt.id,
        modeloId: modeloDCD771C2.id,
        categoriaId: categoriaAccesorio.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'ACC-002' },
      update: {},
      create: {
        numeroParte: 'ACC-002',
        descripcion: 'Disco de corte',
        marcaId: marcaBosch.id,
        modeloId: modeloGBH228F.id,
        categoriaId: categoriaAccesorio.id,
      },
    }),
    // Más EPP
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-007' },
      update: {},
      create: {
        numeroParte: 'EPP-007',
        descripcion: 'Respirador media cara',
        marcaId: marcaHoneywell.id,
        modeloId: modeloNorth7700.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-008' },
      update: {},
      create: {
        numeroParte: 'EPP-008',
        descripcion: 'Lentes antiempañantes',
        marcaId: marcaHoneywell.id,
        modeloId: modeloUvexGenesis.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-009' },
      update: {},
      create: {
        numeroParte: 'EPP-009',
        descripcion: 'Casco con suspensión',
        marcaId: marcaMSA.id,
        modeloId: modeloVGard.id,
        categoriaId: categoriaEPP.id,
      },
    }),
    // Más Herramientas
    prisma.producto.upsert({
      where: { numeroParte: 'HER-004' },
      update: {},
      create: {
        numeroParte: 'HER-004',
        descripcion: 'Taladro inalámbrico',
        marcaId: marcaMakita.id,
        modeloId: modeloXPH12Z.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-005' },
      update: {},
      create: {
        numeroParte: 'HER-005',
        descripcion: 'Esmeril angular',
        marcaId: marcaMakita.id,
        modeloId: modeloGA5030.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-006' },
      update: {},
      create: {
        numeroParte: 'HER-006',
        descripcion: 'Atornillador compacto',
        marcaId: marcaBlackDecker.id,
        modeloId: modeloBDCDD12C.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-007' },
      update: {},
      create: {
        numeroParte: 'HER-007',
        descripcion: 'Alicate universal',
        marcaId: marcaKleinTools.id,
        modeloId: modeloD20009NE.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-008' },
      update: {},
      create: {
        numeroParte: 'HER-008',
        descripcion: 'Destornilladores aislados',
        marcaId: marcaKleinTools.id,
        modeloId: modelo1000V.id,
        categoriaId: categoriaHerramienta.id,
      },
    }),
    // Más Equipos
    prisma.producto.upsert({
      where: { numeroParte: 'EQU-003' },
      update: {},
      create: {
        numeroParte: 'EQU-003',
        descripcion: 'Detector de gases',
        marcaId: marcaMSA.id,
        modeloId: modeloAltair5X.id,
        categoriaId: categoriaEquipo.id,
      },
    }),
    // Más Materiales
    prisma.producto.upsert({
      where: { numeroParte: 'MAT-003' },
      update: {},
      create: {
        numeroParte: 'MAT-003',
        descripcion: 'Cinta de seguridad',
        marcaId: marca3M.id,
        modeloId: modelo1700.id,
        categoriaId: categoriaMaterial.id,
      },
    }),
  ])
  console.log(`   ✓ ${productos.length} productos creados`)

  console.log('')
  console.log('✅ Seed completado exitosamente!')
  console.log('')
  console.log('📝 Usuarios de prueba (password: password123):')
  console.log('   - admin@empresa.com (Administrador)')
  console.log('   - tecnico@empresa.com (Técnico)')
  console.log('   - seguridad@empresa.com (Seguridad)')
  console.log('   - gerencia@empresa.com (Gerencia)')
  console.log('   - logistica@empresa.com (Logística)')
  console.log('   - administracion@empresa.com (Administración)')
  console.log('   - receptor@empresa.com (Receptor)')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
