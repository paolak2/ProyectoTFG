import admin from "../firebase/firebaseAdmin.js";

export const verifyToken = async (req, res, next) => {

  try {

    // Obtener cabecera Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "No se ha enviado el token"
      });
    }

    // Extraer token
    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token inválido"
      });
    }

    // Verificar token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Guardar usuario en la request
    req.user = decodedToken;

    // Continuar ejecución
    next();

  } catch (error) {

    console.error("Error verificando token:", error);

    return res.status(401).json({
      error: "Token no válido o expirado"
    });

  }

};
