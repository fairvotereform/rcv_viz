#! /usr/bin/perl

# converts a .sav file to a CSV
# from pspp.benpfaff.org

use strict;
use warnings;

use CGI;
use PSPP;
use Digest::MD5;

$CGI::POST_MAX = 10 * 1024 * 1024;  # max 10 MB posts

my $q = new CGI;

my $encoding = $q->param('encoding');

if ($q->param('file')) {
    my $temp = $q->upload ('file');

    my $file_name = $q->param ('file');
    $file_name =~ s|.*[/\\]||;  # Remove directories.
    $file_name =~ s|\.[^.]*$||; # Remove extension.

    my $ctx = Digest::MD5->new;
    $ctx->addfile ($temp);
    my $digest = $ctx->hexdigest;
    my $input = "/home/www-pspp/input/$digest.sav";
    my $output = "/home/www-pspp/output/$digest.txt";

    # Save input data.
    seek ($temp, 0, 0);
    open (INPUT, '>', $input);
    my $s;
    my $sig;
    while (sysread ($temp, $s, 4096)) {
        $sig = substr ($s, 0, 2) if !defined $sig;
  syswrite (INPUT, $s);
    }
    close INPUT;

    # Convert.
    $ENV{'LC_ALL'} = 'en_US.utf8';
    my $content_type = 'text/plain; charset=utf-8';
    my $extension = 'txt';
    if ($sig eq 'PK') {
  my (@args) = ('pspp-output', 'convert');
  push (@args, '--show-hidden') if $q->param('export') eq 'all';
  if ($q->param('spvformat') eq 'pdf') {
      $content_type = 'application/pdf';
      $output =~ s/txt$/pdf/;
      $extension = 'pdf';
  } elsif ($q->param('spvformat') eq 'csv') {
      $content_type = 'text/csv';
      $output =~ s/txt$/csv/;
  } elsif ($q->param('spvformat') eq 'txt') {
      $output =~ s/txt$/txt/;
      push (@args, '-O', 'box=unicode') if $q->param('box') eq 'unicode';
  }
  push (@args, $input, $output);
  print STDERR +join(' ', @args), '\n';
  print STDERR +join(' ', $q->param), '\n';
  system @args;
    } elsif ($q->param('format') eq 'txt') {
  open (SPS, '|-', "pspp -o '$output' -O box=unicode") or die;
  if ($encoding) {
      print SPS "SYSFILE INFO ENCODING='$encoding' '$input'.\n";
  } else {
      print SPS "SYSFILE INFO '$input'.\n";
  }
  close SPS;
    } else {
  if ($encoding) {
      system("pspp-convert", "--encoding=$encoding",
       "-O", "csv", $input, $output);
  } else {
      system("pspp-convert", "-O", "csv", $input, $output);
  }
    }
    $file_name .= ".$extension";

    # Dump output.
    print "Content-type: $content_type\r\n";
    print "Content-disposition: inline; filename=\"$file_name\"\r\n";
    print "\r\n";

    $| = 1;
    open (OUTPUT, '<', $output);
    while (sysread (OUTPUT, $s, 4096)) {
  syswrite (STDOUT, $s);
    }
    close OUTPUT;
}