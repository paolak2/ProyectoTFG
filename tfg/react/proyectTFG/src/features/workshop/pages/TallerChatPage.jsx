import { useQuery } from "@tanstack/react-query";
import { API_TALLER_CHAT_URL } from "../../../constantes/constantes";
import useWorkshopAuth from "../context/useWorkshopAuth";

function TallerChatPage() {
  const { authFetch } = useWorkshopAuth();
  const { data = [], isPending, isError, error } = useQuery({
    queryKey: ["taller-chat"],
    queryFn: async () => {
      const response = await authFetch(API_TALLER_CHAT_URL);
      if (!response.ok) {
        throw new Error("No se pudo cargar el chat del taller");
      }
      return response.json();
    },
  });

  return (
    <div className="garage__header">
      <div>
        <h1>Chat</h1>
        {isPending && <p>Cargando mensajes...</p>}
        {isError && <p>{error.message}</p>}
        {!isPending &&
          !isError &&
          data.map((message) => (
            <p key={message.id}>
              <strong>{message.author}:</strong> {message.text}
            </p>
          ))}
      </div>
    </div>
  );
}

export default TallerChatPage;
