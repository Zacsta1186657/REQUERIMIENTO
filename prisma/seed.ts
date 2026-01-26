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
  console.log('📋 Creando productos del catálogo...')

  const categoriaEPP = categorias.find(c => c.nombre === 'EPP')!
  const categoriaEquipo = categorias.find(c => c.nombre === 'EQUIPO')!
  const categoriaHerramienta = categorias.find(c => c.nombre === 'HERRAMIENTA')!
  const categoriaMaterial = categorias.find(c => c.nombre === 'MATERIAL')!

  const unidadUND = unidades.find(u => u.abreviatura === 'UND')!
  const unidadPAR = unidades.find(u => u.abreviatura === 'PAR')!
  const unidadM = unidades.find(u => u.abreviatura === 'M')!
  const unidadRLL = unidades.find(u => u.abreviatura === 'RLL')!

  const productos = await Promise.all([
    // EPP
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-001' },
      update: {},
      create: {
        numeroParte: 'EPP-001',
        descripcion: 'Casco de seguridad',
        marca: '3M',
        modelo: 'H-700',
        categoriaId: categoriaEPP.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-002' },
      update: {},
      create: {
        numeroParte: 'EPP-002',
        descripcion: 'Guantes de nitrilo',
        marca: 'Ansell',
        modelo: 'TouchNTuff',
        categoriaId: categoriaEPP.id,
        unidadMedidaId: unidadPAR.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-003' },
      update: {},
      create: {
        numeroParte: 'EPP-003',
        descripcion: 'Lentes de seguridad',
        marca: '3M',
        modelo: 'SecureFit',
        categoriaId: categoriaEPP.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-004' },
      update: {},
      create: {
        numeroParte: 'EPP-004',
        descripcion: 'Botas de seguridad',
        marca: 'Caterpillar',
        modelo: 'Holton',
        categoriaId: categoriaEPP.id,
        unidadMedidaId: unidadPAR.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-005' },
      update: {},
      create: {
        numeroParte: 'EPP-005',
        descripcion: 'Chaleco reflectivo',
        marca: 'Truper',
        modelo: 'CR-120',
        categoriaId: categoriaEPP.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EPP-006' },
      update: {},
      create: {
        numeroParte: 'EPP-006',
        descripcion: 'Arnés de seguridad',
        marca: '3M',
        modelo: 'Protecta',
        categoriaId: categoriaEPP.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    // Herramientas
    prisma.producto.upsert({
      where: { numeroParte: 'HER-001' },
      update: {},
      create: {
        numeroParte: 'HER-001',
        descripcion: 'Taladro percutor',
        marca: 'Bosch',
        modelo: 'GSB 13 RE',
        categoriaId: categoriaHerramienta.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-002' },
      update: {},
      create: {
        numeroParte: 'HER-002',
        descripcion: 'Amoladora angular',
        marca: 'DeWalt',
        modelo: 'DWE4120',
        categoriaId: categoriaHerramienta.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'HER-003' },
      update: {},
      create: {
        numeroParte: 'HER-003',
        descripcion: 'Juego de llaves',
        marca: 'Stanley',
        modelo: 'STMT74858',
        categoriaId: categoriaHerramienta.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    // Equipos
    prisma.producto.upsert({
      where: { numeroParte: 'EQU-001' },
      update: {},
      create: {
        numeroParte: 'EQU-001',
        descripcion: 'Multímetro digital',
        marca: 'Fluke',
        modelo: '117',
        categoriaId: categoriaEquipo.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'EQU-002' },
      update: {},
      create: {
        numeroParte: 'EQU-002',
        descripcion: 'Radio portátil',
        marca: 'Motorola',
        modelo: 'T82',
        categoriaId: categoriaEquipo.id,
        unidadMedidaId: unidadUND.id,
      },
    }),
    // Materiales
    prisma.producto.upsert({
      where: { numeroParte: 'MAT-001' },
      update: {},
      create: {
        numeroParte: 'MAT-001',
        descripcion: 'Cinta aislante',
        marca: '3M',
        modelo: '1700',
        categoriaId: categoriaMaterial.id,
        unidadMedidaId: unidadRLL.id,
      },
    }),
    prisma.producto.upsert({
      where: { numeroParte: 'MAT-002' },
      update: {},
      create: {
        numeroParte: 'MAT-002',
        descripcion: 'Cable eléctrico THW-14',
        marca: 'INDECO',
        modelo: 'THW-14',
        categoriaId: categoriaMaterial.id,
        unidadMedidaId: unidadM.id,
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
