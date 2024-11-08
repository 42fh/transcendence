
    def _normalize_vector(self, x, y):
        """Normalize a 2D vector"""
        length = math.sqrt(x * x + y * y)
        if length < 1e-10:
            return {"x": 0, "y": 0}
        return {"x": x / length, "y": y / length}
