export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Términos de Servicio y Política de Cumplimiento</h1>
      <p className="text-sm text-muted-foreground mb-6">Última actualización: 26 de marzo de 2026</p>

      <div className="prose prose-sm space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar BG Consult Hub ("la plataforma"), aceptas estos términos de servicio.
            Si no estás de acuerdo, no utilices la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
          <p>
            BG Consult Hub es una plataforma de análisis y visualización de datos de campañas publicitarias
            de Meta Ads (Facebook e Instagram). El servicio permite a los clientes visualizar métricas de
            rendimiento, comparar presupuestos y acceder a reportes de sus campañas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Cuentas de Usuario</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Las cuentas son creadas por el administrador de BG Consult Hub.</li>
            <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
            <li>Debes notificar inmediatamente cualquier uso no autorizado de tu cuenta.</li>
            <li>No debes compartir tus credenciales con terceros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Uso Aceptable</h2>
          <p>Te comprometes a:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Utilizar la plataforma solo para los fines previstos (visualización de datos de campañas).</li>
            <li>No intentar acceder a datos de otros usuarios.</li>
            <li>No realizar ingeniería inversa ni intentar comprometer la seguridad.</li>
            <li>No utilizar la plataforma para actividades ilegales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Cumplimiento con Meta Platform Terms</h2>
          <p>
            Nuestra plataforma cumple con las políticas de la Plataforma de Meta, incluyendo:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Uso de datos:</strong> Los datos obtenidos a través de la API de Meta se utilizan exclusivamente para proporcionar el servicio de análisis al usuario autorizado.</li>
            <li><strong>No venta de datos:</strong> No vendemos, licenciamos ni transferimos datos de Meta a terceros.</li>
            <li><strong>Almacenamiento seguro:</strong> Los datos se almacenan de forma segura con encriptación y controles de acceso.</li>
            <li><strong>Eliminación de datos:</strong> Los usuarios pueden solicitar la eliminación de sus datos en cualquier momento.</li>
            <li><strong>Transparencia:</strong> Informamos claramente qué datos recopilamos y cómo los usamos.</li>
            <li><strong>Consentimiento:</strong> Solo accedemos a datos con autorización explícita del administrador de la cuenta publicitaria.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Política de Eliminación de Datos</h2>
          <p>
            En cumplimiento con las políticas de Meta y regulaciones de protección de datos:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Los usuarios pueden solicitar la eliminación completa de sus datos contactando a jmbarros@bgconsult.cl.</li>
            <li>Al revocar permisos de Meta, eliminaremos todos los datos asociados dentro de 30 días.</li>
            <li>Los datos en caché se eliminan automáticamente después de 30 días.</li>
            <li>La eliminación de una cuenta resulta en la eliminación permanente de todos los datos asociados.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Propiedad Intelectual</h2>
          <p>
            La plataforma y su contenido original son propiedad de BG Consult Hub. Los datos de campañas
            pertenecen a los respectivos anunciantes y se muestran bajo autorización.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitación de Responsabilidad</h2>
          <p>
            BG Consult Hub proporciona datos tal como los recibe de la API de Meta. No garantizamos la
            exactitud absoluta de las métricas mostradas. La plataforma se proporciona "tal cual" sin
            garantías de ningún tipo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Disponibilidad del Servicio</h2>
          <p>
            Nos esforzamos por mantener la plataforma disponible, pero no garantizamos un uptime del 100%.
            El servicio puede verse afectado por mantenimiento, actualizaciones o problemas con la API de Meta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos. Los cambios se notificarán a través
            de la plataforma. El uso continuado después de los cambios constituye aceptación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contacto</h2>
          <p>
            Para preguntas sobre estos términos:<br />
            <strong>BG Consult Hub</strong><br />
            Email: jmbarros@bgconsult.cl
          </p>
        </section>
      </div>
    </div>
  )
}
