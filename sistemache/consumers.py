import json
from channels.generic.websocket import AsyncWebsocketConsumer


class OrderItemConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'orders_group'

        # Unirse al grupo de canales
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Salir del grupo de canales
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Decodificar el mensaje recibido
        text_data_json = json.loads(text_data)
        order_number = text_data_json.get('order_number')
        estado = text_data_json.get('estado')
        eliminado = text_data_json.get('eliminado')
        confirmada = text_data_json.get('confirmada')

        if order_number:
            # Enviar mensaje al grupo con el número de pedido
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'order_message',
                    'order_number': order_number,
                    'estado' : estado,
                    'eliminado' : eliminado,
                    'confirmada' : confirmada,
                    
                }
            )

    async def order_message(self, event):
        order_number = event['order_number']
        estado = event ['estado']
        eliminado = event ['eliminado']
        confirmada = event ['confirmada']

        # Se envia a todos los que esten escuchando el evento
        await self.send(text_data=json.dumps({
            'order_number': order_number,
            'estado' : estado,
            'eliminado' : eliminado,
            'confirmada' : confirmada,
        }))