export const getContract = async (token) => {
  const url = "http://localhost:8000/contracts/";
  const request = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await request.json();
};
