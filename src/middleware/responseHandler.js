const responseHandler = (controllerMethod) => {
    return async (req, res) => {
      try {
        const data = await controllerMethod(req);
        res.json(data || { error: "Not found" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };
  };
  
  module.exports = responseHandler;
  