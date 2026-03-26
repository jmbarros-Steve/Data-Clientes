export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground mb-6">Última actualización: 26 de marzo de 2026</p>

      <div className="prose prose-sm space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Información General</h2>
          <p>
            BG Consult Hub ("nosotros", "nuestro") opera la plataforma de análisis de campañas publicitarias
            disponible en este sitio web. Esta política describe cómo recopilamos, usamos y protegemos la
            información personal de nuestros usuarios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Información que Recopilamos</h2>
          <p>Recopilamos los siguientes tipos de información:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Información de cuenta:</strong> nombre, email, empresa y teléfono proporcionados durante el registro.</li>
            <li><strong>Datos de Meta Ads:</strong> métricas de campañas publicitarias (impresiones, clicks, gastos, conversiones) obtenidos a través de la API de Meta con autorización del usuario.</li>
            <li><strong>Tokens de acceso:</strong> tokens de autenticación de Meta necesarios para acceder a los datos de campañas.</li>
            <li><strong>Datos de uso:</strong> información sobre cómo interactúas con nuestra plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Uso de la Información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Mostrar métricas y análisis de campañas publicitarias de Meta Ads.</li>
            <li>Comparar gastos reales contra presupuestos definidos.</li>
            <li>Proporcionar reportes y visualizaciones de rendimiento.</li>
            <li>Administrar cuentas de usuario y autenticación.</li>
            <li>Mejorar nuestros servicios y experiencia de usuario.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Uso de Datos de Meta</h2>
          <p>
            Accedemos a datos de Meta (Facebook/Instagram) exclusivamente a través de la API oficial de Meta
            Marketing, con los permisos otorgados por el usuario. Específicamente:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Solo accedemos a datos de cuentas publicitarias que el administrador ha autorizado explícitamente.</li>
            <li>Los datos de Meta se utilizan únicamente para mostrar métricas de rendimiento en el dashboard.</li>
            <li>No vendemos, compartimos ni transferimos datos de Meta a terceros.</li>
            <li>Los datos se almacenan en caché temporalmente para mejorar el rendimiento.</li>
            <li>Los tokens de acceso se almacenan de forma segura y encriptada.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Almacenamiento y Seguridad</h2>
          <p>
            Los datos se almacenan en servidores seguros proporcionados por Supabase (infraestructura AWS).
            Implementamos medidas de seguridad incluyendo:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Encriptación en tránsito (HTTPS/TLS).</li>
            <li>Políticas de seguridad a nivel de fila (RLS) en la base de datos.</li>
            <li>Autenticación segura con tokens JWT.</li>
            <li>Acceso restringido: cada cliente solo puede ver sus propios datos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Compartir Información</h2>
          <p>
            No vendemos ni compartimos información personal con terceros, excepto:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Proveedores de infraestructura (Supabase, Vercel) necesarios para operar el servicio.</li>
            <li>Cuando sea requerido por ley o proceso legal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Retención de Datos</h2>
          <p>
            Retenemos los datos mientras la cuenta del usuario esté activa. Los datos en caché de Meta se
            actualizan periódicamente y los registros antiguos se eliminan automáticamente. Al eliminar una
            cuenta, todos los datos asociados se eliminan permanentemente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Derechos del Usuario</h2>
          <p>Los usuarios tienen derecho a:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Acceder a sus datos personales.</li>
            <li>Solicitar la corrección de datos inexactos.</li>
            <li>Solicitar la eliminación de su cuenta y datos.</li>
            <li>Revocar el acceso a datos de Meta en cualquier momento.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Eliminación de Datos</h2>
          <p>
            Para solicitar la eliminación de tus datos, contacta al administrador de tu cuenta o envía un
            email a <strong>jmbarros@bgconsult.cl</strong>. Procesaremos tu solicitud dentro de 30 días.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
          <p>
            Para preguntas sobre esta política de privacidad, contacta a:<br />
            <strong>BG Consult Hub</strong><br />
            Email: jmbarros@bgconsult.cl
          </p>
        </section>
      </div>
    </div>
  )
}
