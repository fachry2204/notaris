<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Map, Marker, Circle } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props=defineProps<{latitude:number|null;longitude:number|null;radius:number}>();
const emit=defineEmits<{ 'update:latitude':[number]; 'update:longitude':[number] }>();
const container=ref<HTMLDivElement|null>(null), error=ref('');
let map:Map|undefined, marker:Marker|undefined, circle:Circle|undefined, L:typeof import('leaflet')|undefined, destroyed=false;
const selected=()=>props.latitude!==null && props.longitude!==null && props.latitude!==('' as any) && props.longitude!==('' as any) && Number.isFinite(Number(props.latitude)) && Number.isFinite(Number(props.longitude)) && Math.abs(Number(props.latitude))<=90 && Math.abs(Number(props.longitude))<=180;
const choose=(point:import('leaflet').LatLng)=>{const p=point.wrap();emit('update:latitude',Number(p.lat.toFixed(7)));emit('update:longitude',Number(p.lng.toFixed(7)));};
const update=()=>{
    if(!map||!L)return;
    if(!selected()){if(marker)map.removeLayer(marker);if(circle)map.removeLayer(circle);marker=undefined;circle=undefined;return;}
    const point=L.latLng(Number(props.latitude),Number(props.longitude));
    if(!marker){marker=L.marker(point,{draggable:true,alt:'Pin lokasi kantor',icon:L.divIcon({className:'office-pin-container',html:'<span class="office-map-pin"></span>',iconSize:[28,36],iconAnchor:[14,34]})}).addTo(map);marker.on('dragend',()=>{if(marker)choose(marker.getLatLng());});}
    else marker.setLatLng(point);
    const radius=Math.max(1,Number(props.radius)||10);
    if(!circle)circle=L.circle(point,{radius,color:'#916819',fillColor:'#c8ad7f',fillOpacity:.24,weight:2}).addTo(map);
    else circle.setLatLng(point).setRadius(radius);
    map.fitBounds(circle.getBounds(),{maxZoom:19,padding:[30,30],animate:false});
};
onMounted(async()=>{
    try{
        L=await import('leaflet');if(destroyed||!container.value)return;
        map=L.map(container.value,{scrollWheelZoom:false}).setView([-6.2,106.816666],12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).on('tileerror',()=>{error.value='Peta dasar belum dapat dimuat. Anda tetap dapat mengisi koordinat atau menggunakan lokasi perangkat.';}).on('tileload',()=>{error.value='';}).addTo(map);
        map.on('click',event=>choose(event.latlng));update();
    }catch{error.value='Peta tidak dapat dibuka. Gunakan kolom koordinat untuk menentukan pin kantor.';}
});
watch(()=>[props.latitude,props.longitude,props.radius],update);
onBeforeUnmount(()=>{destroyed=true;map?.remove();});
</script>
<template><div><div ref="container" class="office-map" role="region" aria-label="Peta penempatan pin kantor"></div><p v-if="error" role="status" class="mt-2 text-sm text-amber-800">{{ error }}</p></div></template>
<style>
.office-map{height:380px;min-width:0;width:100%;border-radius:14px;border:1px solid #d8cdbd;z-index:0;background:#eee8db}.office-map .leaflet-control-attribution{font-size:10px}.office-map-pin{display:block;width:27px;height:27px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;background:#95691a;box-shadow:0 2px 8px #0006}.office-map-pin:after{content:'';position:absolute;inset:7px;border-radius:50%;background:#fff}.office-map .leaflet-control-zoom a{color:#292c2d}@media(max-width:600px){.office-map{height:300px}}
</style>
