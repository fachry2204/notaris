<?php
namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PwaBrandingTest extends TestCase
{
    use DatabaseTransactions;

    private function settings(array $data): void
    {
        DB::table('app_settings')->updateOrInsert(['settings_key'=>'GLOBAL_APP_SETTINGS'], ['id'=>'pwa-test-settings', 'settings_value'=>json_encode($data), 'updated_at'=>now()]);
        Cache::forget('app.global-branding');
    }

    public function test_install_manifest_and_apple_metadata_follow_saved_name_and_uploaded_favicon(): void
    {
        config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost');
        $path=public_path('uploads/settings/pwa-test-fixture.png');
        $image=imagecreatetruecolor(200,100); imagefill($image,0,0,imagecolorallocate($image,210,30,40)); imagepng($image,$path); imagedestroy($image);
        try {
            $this->settings(['general'=>['appName'=>'Kantor Salfa Uji','officeEmail'=>'private@example.invalid'], 'branding'=>['faviconUrl'=>'/uploads/settings/pwa-test-fixture.png']]);
            $manifest=$this->get('/manifest.webmanifest')->assertOk()->assertHeader('Content-Type','application/manifest+json')->assertJsonPath('name','Kantor Salfa Uji')->assertJsonPath('short_name','Kantor Salfa Uji');
            $this->assertStringNotContainsString('private@example.invalid',$manifest->getContent());
            foreach ([180,192,512] as $size) {
                $response=$this->get('/pwa/brand-icon-'.$size.'.png')->assertOk()->assertHeader('Content-Type','image/png');
                $info=getimagesizefromstring($response->getContent()); $this->assertSame($size,$info[0]); $this->assertSame($size,$info[1]);
                $png=imagecreatefromstring($response->getContent());
                $this->assertSame(['red'=>210,'green'=>30,'blue'=>40,'alpha'=>0],imagecolorsforindex($png,imagecolorat($png,(int)($size/2),(int)($size/2)))); imagedestroy($png);
            }
            $this->get('/login')->assertOk()->assertSee('name="apple-mobile-web-app-title" content="Kantor Salfa Uji"',false)->assertSee('rel="apple-touch-icon" sizes="180x180"',false);
            $oldIcon=$manifest->json('icons.0.src');
            $this->settings(['general'=>['appName'=>'Nama Diperbarui'], 'branding'=>['faviconUrl'=>'/uploads/settings/pwa-test-fixture.png']]);
            $this->get('/manifest.webmanifest')->assertJsonPath('short_name','Nama Diperbarui');
            $this->assertNotSame($oldIcon,$this->get('/manifest.webmanifest')->json('icons.0.src'));
            $this->get('/pwa/brand-icon-999.png')->assertNotFound();
        } finally { @unlink($path); Cache::forget('app.global-branding'); }
    }

    public function test_invalid_missing_and_remote_icons_use_local_logo_or_default_without_fetching_remote_urls(): void
    {
        config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost');
        foreach (['/../.env','https://example.invalid/icon.png','/uploads/settings/missing.png'] as $value) {
            $this->settings(['general'=>['appName'=>''], 'branding'=>['faviconUrl'=>$value, 'logoUrl'=>'/images/dashboard/nr-gold-logo.png']]);
            $this->get('/manifest.webmanifest')->assertOk()->assertJsonPath('name','Notaris Digital');
            $response=$this->get('/pwa/brand-icon-512.png?maskable=1')->assertOk();
            $info=getimagesizefromstring($response->getContent()); $this->assertSame(512,$info[0]);
        }
    }
}
