class PersistentClient:
    def __init__(self, *args, **kwargs):
        pass
    def persist(self):
        """Persist data to disk.  The test stub does nothing."""
        pass
    def get_or_create_collection(self, name, **kwargs):
        class Collection:
            def add(self, *args, **kwargs):
                pass
            def delete(self, *args, **kwargs):
                pass
            def query(self, *args, **kwargs):
                return []
        return Collection()
