import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function useUserId() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("animochat_user_id");
    if (!storedUserId) {
      const newUserId = uuidv4();
      localStorage.setItem("animochat_user_id", newUserId);
      setUserId(newUserId);
    } else {
      setUserId(storedUserId);
    }
  }, []);

  return userId;
}
