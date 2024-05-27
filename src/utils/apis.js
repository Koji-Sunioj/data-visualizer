export const getContract = async (token) => {
  const url = "http://localhost:8000/contracts/";
  const request = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await request.json();
};

export const getCalendarDays = async (params) => {
  const [token, month, year] = params;
  const url = `http://localhost:8000/shifts/month/${month}/year/${year}`;
  console.log(url);
  const request = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const { calendar } = await request.json();
  console.log(calendar);
  return calendar;
};

export const checkSession = async (oldToken) => {
  try {
    const url = "http://localhost:8000/session";
    const request = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${oldToken}` },
    });
    const { status } = request;
    if (status !== 200) {
      throw new Error("invalid credentials");
    }
    const { token } = await request.json();
    return token;
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};
